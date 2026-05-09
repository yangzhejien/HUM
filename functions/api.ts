/**
 * HUM Journal API - Cloudflare Pages Function with D1
 */
import { getGlobal } from "cloudflare:workers-do";

export const config: PagesFunctionConfig = {
  route: "/api/*",
};

interface Env {
  DB: D1Database;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle OPTIONS preflight
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the D1 database binding
    const db = env.DB;

    // ARTICLES endpoints
    if (path === "/api/articles") {
      if (method === "GET") {
        // List articles - support query params for filtering
        const category = url.searchParams.get("category");
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");

        let query = "SELECT * FROM articles WHERE 1=1";
        const params: string[] = [];

        if (category) {
          query += " AND category = ?";
          params.push(category);
        }
        if (status) {
          query += " AND status = ?";
          params.push(status);
        }
        if (search) {
          query += " AND (title LIKE ? OR author LIKE ? OR keywords LIKE ?)";
          const searchPattern = `%${search}%`;
          params.push(searchPattern, searchPattern, searchPattern);
        }

        query += " ORDER BY created_at DESC";

        const result = await db.prepare(query).bind(...params).all();

        return new Response(JSON.stringify(result.results), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (method === "POST") {
        // Create new article
        const data = await request.json();

        const result = await db
          .prepare(
            `INSERT INTO articles (title, author, email, abstract, content, keywords, category, status, file_url, pdf_data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            data.title,
            data.author || null,
            data.email || null,
            data.abstract || null,
            data.content || null,
            data.keywords || null,
            data.category || "public",
            data.status || "pending",
            data.file_url || null,
            data.pdf_data || null
          )
          .run();

        return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Single article endpoints
    const articleMatch = path.match(/^\/api\/articles\/(\d+)$/);
    if (articleMatch) {
      const id = articleMatch[1];

      if (method === "GET") {
        const result = await db
          .prepare("SELECT * FROM articles WHERE id = ?")
          .bind(parseInt(id))
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (method === "PATCH") {
        const data = await request.json();

        // Build dynamic update query
        const fields: string[] = [];
        const values: (string | number | null)[] = [];

        if (data.title !== undefined) {
          fields.push("title = ?");
          values.push(data.title);
        }
        if (data.author !== undefined) {
          fields.push("author = ?");
          values.push(data.author);
        }
        if (data.email !== undefined) {
          fields.push("email = ?");
          values.push(data.email);
        }
        if (data.abstract !== undefined) {
          fields.push("abstract = ?");
          values.push(data.abstract);
        }
        if (data.content !== undefined) {
          fields.push("content = ?");
          values.push(data.content);
        }
        if (data.keywords !== undefined) {
          fields.push("keywords = ?");
          values.push(data.keywords);
        }
        if (data.category !== undefined) {
          fields.push("category = ?");
          values.push(data.category);
        }
        if (data.status !== undefined) {
          fields.push("status = ?");
          values.push(data.status);
        }
        if (data.file_url !== undefined) {
          fields.push("file_url = ?");
          values.push(data.file_url);
        }
        if (data.pdf_data !== undefined) {
          fields.push("pdf_data = ?");
          values.push(data.pdf_data);
        }

        if (fields.length === 0) {
          return new Response(JSON.stringify({ error: "No fields to update" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        fields.push("updated_at = datetime('now')");
        values.push(parseInt(id));

        const query = `UPDATE articles SET ${fields.join(", ")} WHERE id = ?`;
        await db.prepare(query).bind(...values).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (method === "DELETE") {
        await db.prepare("DELETE FROM articles WHERE id = ?").bind(parseInt(id)).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // 404 for unmatched routes
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}