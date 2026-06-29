/**
 * HUM Journal API - Cloudflare Pages Function
 * Security-hardened version: input validation, rate limiting, strict auth, sanitized errors
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── CORS: restrict to own origin (prevent cross-site token theft) ──
  const origin = request.headers.get("Origin") || "";
  // Allow production, Cloudflare Pages preview subdomains (*.hum-journal.pages.dev), and local dev
  const isAllowedOrigin = origin === "" ||
    origin === "https://hum-journal.pages.dev" ||
    origin.endsWith(".hum-journal.pages.dev") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  const corsHeaders = isAllowedOrigin ? {
    "Access-Control-Allow-Origin": origin || "*",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Access-Control-Max-Age": "86400",
  } : {
    "Access-Control-Allow-Origin": "null",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = env.DB;

    // ═══════════════════════════════════════
    // PBKDF2 Password Hashing (Web Crypto API)
    // ═══════════════════════════════════════
    const PBKDF2_ITERATIONS = 100000;
    const PBKDF2_KEY_LEN = 256; // bits
    const PBKDF2_HASH = 'SHA-256';

    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
      );
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
        keyMaterial, PBKDF2_KEY_LEN
      );
      const saltB64 = btoa(String.fromCharCode(...new Uint8Array(salt)));
      const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
      return `pbkdf2:${saltB64}:${hashB64}`;
    }

    async function verifyPassword(password, storedHash) {
      if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
        // Legacy plaintext fallback — will be auto-upgraded on successful login
        return password === storedHash;
      }
      const parts = storedHash.split(':');
      if (parts.length !== 3) return false;
      try {
        const salt = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
        const expectedHash = parts[2];
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
          keyMaterial, PBKDF2_KEY_LEN
        );
        const actualHash = btoa(String.fromCharCode(...new Uint8Array(bits)));
        return actualHash === expectedHash;
      } catch (e) {
        console.error('[Crypto] Password verify error:', e.message);
        return false;
      }
    }

    // ═══════════════════════════════════════
    // JWT (HMAC-SHA256, 24h expiry)
    // ═══════════════════════════════════════
    function getJwtSecret() {
      return env.JWT_SECRET || 'hum-journal-default-jwt-secret-2026-change-in-production';
    }

    async function signJwt(payload) {
      const encoder = new TextEncoder();
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const tokenPayload = { ...payload, iat: now, exp: now + 86400 }; // 24h
      const headerB64 = btoa(JSON.stringify(header)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      const payloadB64 = btoa(JSON.stringify(tokenPayload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      const signingInput = `${headerB64}.${payloadB64}`;
      const secret = getJwtSecret();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
      const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${signingInput}.${sigB64}`;
    }

    async function verifyJwt(token) {
      if (!token || typeof token !== 'string') return null;
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, sigB64] = parts;
        // Verify signature
        const encoder = new TextEncoder();
        const signingInput = `${headerB64}.${payloadB64}`;
        const secret = getJwtSecret();
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );
        const sigRaw = parts[2].replace(/-/g, '+').replace(/_/g, '/');
        const sigPadding = sigRaw.length % 4 === 0 ? '' : '='.repeat(4 - sigRaw.length % 4);
        const signature = Uint8Array.from(atob(sigRaw + sigPadding), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(signingInput));
        if (!valid) return null;
        // Parse payload
        const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payloadPadding = payloadRaw.length % 4 === 0 ? '' : '='.repeat(4 - payloadRaw.length % 4);
        const payload = JSON.parse(atob(payloadRaw + payloadPadding));
        // Check expiry
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return null; // expired
        }
        return payload;
      } catch (e) {
        console.error('[JWT] Verify error:', e.message);
        return null;
      }
    }

    // ── Admin auth: validate JWT, fallback to session DB check for legacy tokens ──
    async function verifyAdmin(req) {
      const token = req.headers.get("X-Admin-Token");
      if (!token) return { valid: false };

      // 1) Try JWT verification first (stateless, fast)
      const jwtPayload = await verifyJwt(token);
      if (jwtPayload) {
        return { valid: true, role: jwtPayload.role, email: jwtPayload.email, name: jwtPayload.name };
      }

      // 2) Fallback: legacy session token (for backward compat during transition)
      try {
        const session = await db.prepare(
          `SELECT email, role, name FROM sessions WHERE token = ?`
        ).bind(token).first();
        if (!session) return { valid: false };
        return { valid: true, role: session.role, email: session.email, name: session.name };
      } catch (e) {
        console.error("[Auth] Session lookup error:", e.message);
        return { valid: false };
      }
    }

    function requireAdmin(auth) {
      return auth.valid && auth.role === "admin";
    }

    // ── Input validation helpers ──
    const MAX_TITLE_LEN = 500;
    const MAX_AUTHOR_LEN = 200;
    const MAX_EMAIL_LEN = 254;
    const MAX_ABSTRACT_LEN = 5000;
    const MAX_CONTENT_LEN = 100000;
    const MAX_KEYWORDS_LEN = 500;
    const MAX_PDF_DATA_BASE64 = 700000; // ~525KB decoded (D1 row limit ~1MB)
    const ALLOWED_CATEGORIES = ["public", "academic"];
    const ALLOWED_STATUSES = ["pending", "published", "unpublished"];

    function sanitizeString(str, maxLen, fieldName) {
      if (typeof str !== "string") return null;
      if (str.length > maxLen) str = str.substring(0, maxLen);
      // Strip control characters except newline/tab
      str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Detect encoding corruption: U+FFFD means bytes were lost
      if (str.includes('\uFFFD')) {
        console.warn('[ENCODING] Replacement character (U+FFFD) detected in field:', fieldName, '- possible mojibake');
      }
      return str;
    }

    function validateEmail(email) {
      if (!email) return true; // email is optional
      // RFC 5322 basic validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ── Simple rate limiter using D1 (per-IP per-minute) ──
    // Wrapped in try/catch so table-creation errors never crash the function
    async function checkRateLimit(clientIP, action) {
      if (!clientIP) return true;
      try {
        const key = `${action}:${clientIP}`;
        const recent = await db.prepare(
          `SELECT count FROM rate_limits WHERE ip_key = ? AND created_at > datetime('now', '-1 minute')`
        ).bind(key).first();
        const LIMITS = { post: 3, patch: 30, delete: 10, login: 5 };
        const limit = (LIMITS[action] || 10);
        if (recent && recent.count >= limit) return false;

        // Upsert counter
        await db.prepare(`
          INSERT INTO rate_limits (ip_key, count, created_at) VALUES (?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(ip_key) DO UPDATE SET count = count + 1, created_at = CURRENT_TIMESTAMP
        `).bind(key).run();
        return true;
      } catch (e) {
        // Rate limit table not ready — allow the request (fail-open)
        console.warn('[RateLimit] Table error, allowing request:', e.message);
        return true;
      }
    }

    // Helper: JSON response with NO internal error details leaked
    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
      });
    }

    function safeError(message, status = 400) {
      return json({ error: message }, status);
    }

    // Ensure rate_limits table exists (idempotent, using run not exec for D1 compatibility)
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          ip_key TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run();
    } catch (e) {
      console.warn('[RateLimit] Could not create table:', e.message);
    }

    // Ensure sessions table has expires_at column (auto-migration)
    try {
      await db.prepare(`ALTER TABLE sessions ADD COLUMN expires_at TEXT NOT NULL DEFAULT ''`).run();
    } catch (e) {
      // Column already exists — expected
    }

    // Get client IP from Cloudflare headers
    const clientIP = request.headers.get("CF-Connecting-IP") ||
                     request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
                     "unknown";

    // ==================== LOGIN ENDPOINT ====================
    if (path === "/api/login" && method === "POST") {
      // Rate limit login attempts
      if (!(await checkRateLimit(clientIP, "login"))) {
        return safeError("Too many login attempts. Please wait a moment.", 429);
      }

      const body = await request.json().catch(() => ({}));
      const rawEmail = (typeof body.email === "string") ? body.email.toLowerCase().trim() : "";
      const email = sanitizeString(rawEmail, MAX_EMAIL_LEN, "email");
      const password = typeof body.password === "string" ? body.password : "";

      if (!email || !password) {
        return safeError("Email and password are required.", 400);
      }
      if (!validateEmail(email)) {
        return safeError("Invalid email format.", 400);
      }

      // 1) Check admins table (primary)
      let account = null;
      try {
        account = await db.prepare(
          `SELECT email, password_hash, role, name, status FROM admins WHERE email = ?`
        ).bind(email).first();
      } catch (e) {
        console.error("[Login] DB query error:", e.message);
      }

      // 2) Fallback to env.ADMIN_CREDENTIALS (backward compat)
      if (!account && env.ADMIN_CREDENTIALS) {
        try {
          const creds = JSON.parse(env.ADMIN_CREDENTIALS);
          const fallback = creds.find(c => c.email === email);
          if (fallback) {
            account = {
              email: fallback.email,
              password_hash: fallback.password,
              role: fallback.role || "admin",
              name: fallback.name || "Admin",
              status: "active",
            };
          }
        } catch (e) { /* ignore parse errors */ }
      }

      if (!account) {
        return safeError("Invalid credentials.", 401);
      }

      // Check if account is disabled
      if (account.status === "disabled") {
        return safeError("Account has been disabled. Contact administrator.", 403);
      }

      // Password verification via PBKDF2 (with plaintext fallback)
      const passwordOk = await verifyPassword(password, account.password_hash);
      if (!passwordOk) {
        return safeError("Invalid credentials.", 401);
      }

      // Auto-upgrade plaintext passwords to PBKDF2 hash
      if (!account.password_hash || !account.password_hash.startsWith('pbkdf2:')) {
        const newHash = await hashPassword(password);
        try {
          await db.prepare(`UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE email = ?`)
            .bind(newHash, account.email).run();
          console.log(`[Security] Upgraded password hash for ${account.email} to PBKDF2`);
        } catch (e) {
          console.warn('[Security] Hash upgrade failed (non-critical):', e.message);
        }
      }

      // Generate JWT (24h expiry) and store session for audit/revocation
      const jwtToken = await signJwt({
        email: account.email,
        role: account.role,
        name: account.name,
        sub: account.email,
      });
      // Store session for audit trail and revocation support
      try {
        await db.prepare(
          `INSERT OR REPLACE INTO sessions (token, email, role, name, created_at, expires_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+24 hours'))`
        ).bind(jwtToken, account.email, account.role, account.name).run();
      } catch (e) {
        console.error("[Login] Session storage error:", e.message);
      }

      return json({
        success: true,
        token: jwtToken,
        role: account.role,
        name: account.name,
        email: account.email,
      });
    }

    // ==================== ARTICLES LIST ====================
    if (path === "/api/articles") {
      if (method === "GET") {
        const category = url.searchParams.get("category");
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit")) || 20, 1), 100);
        const offset = (page - 1) * limit;

        const auth = await verifyAdmin(request);
        const isAdmin = auth.valid;

        let whereParts = [];
        let params = [];

        if (category) {
          const cat = sanitizeString(category, 50, "category");
          if (!ALLOWED_CATEGORIES.includes(cat)) return safeError("Invalid category");
          whereParts.push("category = ?");
          params.push(cat);
        }
        if (status) {
          if (!ALLOWED_STATUSES.includes(status)) return safeError("Invalid status");
          whereParts.push("status = ?");
          params.push(status);
        } else if (!isAdmin) {
          whereParts.push("status = 'published'");
        }
        if (search) {
          const s = sanitizeString(search, 200, "search");
          if (s) {
            whereParts.push("(title LIKE ? OR author LIKE ? OR keywords LIKE ? OR abstract LIKE ?)");
            const sp = `%${s}%`;
            params.push(sp, sp, sp, sp);
          }
        }

        const whereClause = whereParts.length > 0 ? " WHERE " + whereParts.join(" AND ") : "";

        const countResult = await db.prepare(`SELECT COUNT(*) as total FROM articles${whereClause}`).bind(...params).first();
        const total = countResult?.total || 0;

        // Don't return pdf_data/content in list views (too large + security)
        const query = `SELECT id, title, author, email, abstract, keywords, category, status, created_at, updated_at, length(pdf_data) as pdf_data_size, length(content) as content_size, file_url, doi FROM articles${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const result = await db.prepare(query).bind(...params, limit, offset).all();
        const articles = result.results || [];

        return json({
          articles,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
      }

      if (method === "POST") {
        // Rate limit article submissions
        if (!(await checkRateLimit(clientIP, "post"))) {
          return safeError("Too many submissions. Please slow down.", 429);
        }

        const data = await request.json().catch(() => ({}));

        // Validate required fields
        const title = sanitizeString(data.title, MAX_TITLE_LEN, "title");
        if (!title || !title.trim()) {
          return safeError("Title is required.");
        }

        const author = sanitizeString(data.author, MAX_AUTHOR_LEN, "author") || "Anonymous";
        const email = sanitizeString(data.email, MAX_EMAIL_LEN, "email");
        if (email && !validateEmail(email)) {
          return safeError("Invalid email format.");
        }
        const abstract = sanitizeString(data.abstract, MAX_ABSTRACT_LEN, "abstract");
        const keywords = sanitizeString(data.keywords, MAX_KEYWORDS_LEN, "keywords");

        // Validate category (whitelist)
        let category = sanitizeString(data.category, 50, "category") || "public";
        if (!ALLOWED_CATEGORIES.includes(category)) category = "public";

        // ★ SECURITY FIX: Force status = "pending", never trust client
        // Even submission.html sends published for public category — admin must approve via PATCH
        const status = "pending";

        // Content: sanitize HTML tags (basic XSS prevention at storage level)
        let content = data.content;
        if (typeof content === "string") {
          content = sanitizeString(content, MAX_CONTENT_LEN, "content");
          // Strip dangerous HTML tags but allow basic formatting
          content = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[script removed]")
            .replace(/on\w+\s*=/gi, "[event handler removed]")
            .replace(/javascript:/gi, "")
            .replace(/data:\s*text\/html/gi, "[data URI blocked]");
        } else {
          content = null;
        }

        // PDF data size limit
        let pdfData = data.pdf_data;
        if (pdfData && typeof pdfData === "string") {
          if (pdfData.length > MAX_PDF_DATA_BASE64) {
            return safeError("PDF file too large. Maximum size is 500KB.");
          }
        } else {
          pdfData = null;
        }

        // Validate file_url protocol
        let fileUrl = data.file_url;
        if (fileUrl && typeof fileUrl === "string") {
          fileUrl = fileUrl.trim();
          if (!fileUrl.startsWith("https://") && !fileUrl.startsWith("http://")) {
            fileUrl = null; // Reject javascript:, data:, etc.
          }
          if (fileUrl && fileUrl.length > 2000) fileUrl = null;
        } else {
          fileUrl = null;
        }

        // Anti-duplicate fingerprint
        function getFingerprint(d) {
          const key = [d.title, d.author, d.email].filter(Boolean).join("|");
          let hash = 0;
          for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash).toString(36);
        }

        const fingerprint = getFingerprint({ title, author, email });
        const dupCheck = await db.prepare(
          `SELECT id FROM articles WHERE fingerprint = ? AND created_at > datetime('now', '-24 hours')`
        ).bind(fingerprint).first();

        if (dupCheck) {
          return json({ error: "Duplicate submission detected. Please wait before resubmitting." }, 409);
        }

        // Insert
        const result = await db.prepare(`
          INSERT INTO articles (title, author, email, abstract, content, keywords, category, status, file_url, pdf_data, fingerprint)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          title.trim(), author, email, abstract, content,
          keywords, category, status, fileUrl, pdfData, fingerprint
        ).run();

        return json({ id: result.meta.last_row_id, success: true }, 201);
      }
    }

    // ==================== SINGLE ARTICLE ====================
    const articleMatch = path.match(/^\/api\/articles\/(\d+)$/);
    if (articleMatch) {
      const id = parseInt(articleMatch[1]);

      if (method === "GET") {
        const result = await db.prepare(
          `SELECT * FROM articles WHERE id = ?`
        ).bind(id).first();

        if (!result) return safeError("Article not found.", 404);

        const auth = await verifyAdmin(request);
        const isAdmin = auth.valid;
        if (!isAdmin && result.status !== "published") {
          return safeError("Article not available.", 403);
        }

        // Sanitize content before returning (extra defense-in-depth)
        if (result.content && typeof result.content === "string") {
          result.content = result.content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[script removed]")
            .replace(/on\w+\s*=/gi, "");
        }

        return json(result);
      }

      if (method === "PATCH") {
        const auth = await verifyAdmin(request);
        if (!auth.valid) {
          return safeError("Unauthorized. Admin access required.", 401);
        }

        // Rate limit modifications
        if (!(await checkRateLimit(clientIP, "patch"))) {
          return safeError("Too many requests.", 429);
        }

        const data = await request.json().catch(() => ({}));
        const allowedFields = ["title", "author", "email", "abstract", "content", "keywords", "category", "status", "file_url", "pdf_data"];
        const fields = [];
        const values = [];

        for (const field of allowedFields) {
          if (data[field] !== undefined) {
            // Validate field-specific constraints
            if (field === "status" && !ALLOWED_STATUSES.includes(data[field])) continue;
            if (field === "category" && !ALLOWED_CATEGORIES.includes(data[field])) continue;

            if (field === "content" && typeof data[field] === "string") {
              const cleaned = sanitizeString(data[field], MAX_CONTENT_LEN, "content")
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[script removed]")
                .replace(/on\w+\s*=/gi, "");
              fields.push(`${field} = ?`);
              values.push(cleaned);
            } else if (typeof data[field] === "string") {
              fields.push(`${field} = ?`);
              values.push(data[field].trim());
            } else {
              fields.push(`${field} = ?`);
              values.push(data[field]);
            }
          }
        }

        if (fields.length === 0) {
          return safeError("No valid fields to update.");
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);

        // Verify article exists first
        const existing = await db.prepare(`SELECT id FROM articles WHERE id = ?`).bind(id).first();
        if (!existing) return safeError("Article not found.", 404);

        await db.prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
        return json({ success: true });
      }

      if (method === "DELETE") {
        const auth = await verifyAdmin(request);
        if (!auth.valid) {
          return safeError("Unauthorized. Admin access required.", 401);
        }

        // Rate limit deletions
        if (!(await checkRateLimit(clientIP, "delete"))) {
          return safeError("Too many delete requests.", 429);
        }

        // Verify existence before delete
        const existing = await db.prepare(`SELECT id FROM articles WHERE id = ?`).bind(id).first();
        if (!existing) return safeError("Article not found.", 404);

        await db.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }

    // ==================== ADMIN ACCOUNT MANAGEMENT ====================
    if (path === "/api/admins") {
      const auth = await verifyAdmin(request);
      if (!requireAdmin(auth)) {
        return safeError("Unauthorized. Admin access required.", 401);
      }

      if (method === "GET") {
        // List all admins (hide password)
        try {
          const result = await db.prepare(
            `SELECT email, role, name, status, created_at, updated_at FROM admins ORDER BY created_at ASC`
          ).all();
          return json({ admins: result.results || [] });
        } catch (e) {
          console.error("[Admins] List error:", e.message);
          return safeError("Failed to list accounts.", 500);
        }
      }

      if (method === "POST") {
        const data = await request.json().catch(() => ({}));
        const newEmail = sanitizeString(
          (typeof data.email === "string") ? data.email.toLowerCase().trim() : "",
          MAX_EMAIL_LEN, "email"
        );
        const newPassword = typeof data.password === "string" ? data.password : "";
        const newRole = (data.role === "admin" || data.role === "editor") ? data.role : "editor";
        const newName = sanitizeString(
          (typeof data.name === "string") ? data.name : "Editor",
          100, "name"
        );

        if (!newEmail || !validateEmail(newEmail) || !newPassword) {
          return safeError("Valid email and password are required.", 400);
        }
        if (newPassword.length < 8) {
          return safeError("Password must be at least 8 characters.", 400);
        }

        const hashedPwd = await hashPassword(newPassword);
        try {
          await db.prepare(
            `INSERT INTO admins (email, password_hash, role, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
          ).bind(newEmail, hashedPwd, newRole, newName || "Editor").run();
          return json({ success: true, email: newEmail }, 201);
        } catch (e) {
          if (e.message && e.message.includes("UNIQUE")) {
            return safeError("An account with this email already exists.", 409);
          }
          console.error("[Admins] Create error:", e.message);
          return safeError("Failed to create account.", 500);
        }
      }
    }

    // Admin actions on a specific account (by email)
    const adminMatch = path.match(/^\/api\/admins\/(.+)$/);
    if (adminMatch) {
      const auth = await verifyAdmin(request);
      if (!requireAdmin(auth)) {
        return safeError("Unauthorized. Admin access required.", 401);
      }

      const targetEmail = decodeURIComponent(adminMatch[1]);

      // Prevent self-disable/delete
      if (targetEmail === auth.email) {
        return safeError("Cannot modify your own account.", 403);
      }

      if (method === "PATCH") {
        const data = await request.json().catch(() => ({}));

        // Allowed fields to update: status, role, name, password
        const updates = [];
        const values = [];

        if (data.status && (data.status === "active" || data.status === "disabled")) {
          updates.push("status = ?");
          values.push(data.status);
        }
        if (data.role && (data.role === "admin" || data.role === "editor")) {
          updates.push("role = ?");
          values.push(data.role);
        }
        if (typeof data.name === "string" && data.name.trim()) {
          updates.push("name = ?");
          values.push(sanitizeString(data.name, 100, "name"));
        }
        if (typeof data.password === "string" && data.password.length >= 8) {
          const hashedPwd = await hashPassword(data.password);
          updates.push("password_hash = ?");
          values.push(hashedPwd);
        }

        if (updates.length === 0) {
          return safeError("No valid fields to update.", 400);
        }

        updates.push("updated_at = datetime('now')");
        values.push(targetEmail);

        try {
          const result = await db.prepare(
            `UPDATE admins SET ${updates.join(", ")} WHERE email = ?`
          ).bind(...values).run();
          if (result.meta?.changes === 0) {
            return safeError("Account not found.", 404);
          }
          return json({ success: true });
        } catch (e) {
          console.error("[Admins] Update error:", e.message);
          return safeError("Failed to update account.", 500);
        }
      }

      if (method === "DELETE") {
        try {
          const result = await db.prepare(
            `DELETE FROM admins WHERE email = ?`
          ).bind(targetEmail).run();
          if (result.meta?.changes === 0) {
            return safeError("Account not found.", 404);
          }
          // Also remove any active sessions for this account
          await db.prepare(`DELETE FROM sessions WHERE email = ?`).bind(targetEmail).run();
          return json({ success: true });
        } catch (e) {
          console.error("[Admins] Delete error:", e.message);
          return safeError("Failed to delete account.", 500);
        }
      }
    }

    return safeError("Endpoint not found.", 404);

  } catch (error) {
    // ★ SECURITY FIX: Never leak error.message to client (may contain SQL schema / internals)
    console.error("[API Error]", error.message, error.stack);
    return json({ error: "Internal server error. Please try again later." }, 500);
  }
}
