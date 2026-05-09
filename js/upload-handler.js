/**
 * HUM Journal - Word to PDF Upload Handler
 * Converts Word to PDF and stores in Supabase Storage (papers bucket)
 */

const SUPABASE_URL = 'https://gslggufgrtmdeyyyveay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs';
const STORAGE_BUCKET = 'papers';

let supabaseUpload = null;

async function initSupabase() {
    if (typeof window.supabase !== 'undefined' && !supabaseUpload) {
        supabaseUpload = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseUpload;
}

async function wordToPdf(file, articleTitle, author) {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();

            // Extract text from Word using mammoth
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const text = result.value;

            if (!text || text.trim().length === 0) {
                reject(new Error('Cannot extract Word content'));
                return;
            }

            // Load pdfmake dynamically
            if (typeof pdfMake === 'undefined') {
                await loadPdfMake();
            }

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [60, 60, 60, 60],
                content: [
                    { text: articleTitle || 'Untitled', style: 'title' },
                    { text: `Author: ${author || 'Unknown'}`, style: 'author', margin: [0, 10, 0, 20] },
                    { text: 'Abstract:', style: 'heading', margin: [0, 0, 0, 10] },
                    { text: text, style: 'body', margin: [0, 0, 0, 20] }
                ],
                styles: {
                    title: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
                    author: { fontSize: 12, alignment: 'center', italics: true },
                    heading: { fontSize: 14, bold: true },
                    body: { fontSize: 11, lineHeight: 1.5, textAlign: 'justify' }
                },
                defaultStyle: { font: 'Helvetica' }
            };

            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            pdfDocGenerator.getBlob((blob) => {
                const pdfFile = new File([blob], file.name.replace('.docx', '.pdf'), {
                    type: 'application/pdf',
                    lastModified: new Date().getTime()
                });
                resolve(pdfFile);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function loadPdfMake() {
    return new Promise((resolve, reject) => {
        if (typeof pdfMake !== 'undefined') { resolve(); return; }
        const pdfMakeScript = document.createElement('script');
        pdfMakeScript.src = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/pdfmake.min.js';
        pdfMakeScript.onload = () => {
            const pdfFontsScript = document.createElement('script');
            pdfFontsScript.src = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/vfs_fonts.js';
            pdfFontsScript.onload = resolve;
            pdfFontsScript.onerror = reject;
            document.head.appendChild(pdfFontsScript);
        };
        pdfMakeScript.onerror = reject;
        document.head.appendChild(pdfMakeScript);
    });
}

// Sanitize filename for Supabase Storage (remove special chars, keep alphanumeric and basic punctuation)
function sanitizeFileName(name) {
    return name
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII chars (Chinese, etc.)
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace remaining special chars with underscore
        .replace(/_+/g, '_') // Collapse multiple underscores
        .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
        .toLowerCase();
}

// Upload PDF to Supabase Storage (papers bucket)
async function uploadToStorage(pdfFile, articleTitle) {
    await initSupabase();
    
    const safeName = sanitizeFileName(pdfFile.name) || 'document.pdf';
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `uploads/${fileName}`;
    
    // Upload to Storage
    const { data, error } = await supabaseUpload.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, pdfFile, {
            contentType: 'application/pdf',
            upsert: false
        });
    
    if (error) {
        throw new Error('Storage upload failed: ' + error.message);
    }
    
    // Get public URL
    const { data: urlData } = supabaseUpload.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // Create article record with file_url pointing to Storage
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            title: articleTitle || 'Untitled',
            author: 'Pending',
            email: 'pending@pending.com',
            category: 'Unknown',
            status: 'pending',
            content: 'File upload via Storage',
            file_url: publicUrl,
            file_name: pdfFile.name,
            file_size: pdfFile.size
        })
    });

    if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error('Failed to create article record: ' + err);
    }

    const articles = await createRes.json();
    const articleId = articles[0]?.id;

    return {
        path: filePath,
        url: publicUrl,
        fileName: pdfFile.name,
        articleId: articleId
    };
}

// Full workflow: Word -> PDF -> Storage
async function processWordUpload(file, articleTitle, author) {
    try {
        console.log('Converting Word to PDF...');
        const pdfFile = await wordToPdf(file, articleTitle, author);
        console.log('Word converted to PDF:', pdfFile.name);

        console.log('Uploading PDF to Storage...');
        const result = await uploadToStorage(pdfFile, articleTitle);
        console.log('Upload complete:', result);

        return { success: true, pdfFile: pdfFile, ...result };
    } catch (error) {
        console.error('Process error:', error);
        return { success: false, error: error.message };
    }
}

function getPreviewUrl(fileUrl) {
    return fileUrl;
}

// For admin to get PDF URL from article
async function fetchArticlePdf(articleId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}&select=file_url,file_name`, {
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.file_url || null;
}

window.HUMUpload = {
    init: initSupabase,
    wordToPdf: wordToPdf,
    uploadToStorage: uploadToStorage,
    process: processWordUpload,
    getPreviewUrl: getPreviewUrl,
    fetchArticlePdf: fetchArticlePdf
};
