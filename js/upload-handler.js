/**
 * HUM Journal - Word to PDF Upload Handler
 * Handles Word document conversion, PDF generation, and Supabase Storage upload
 */

// Supabase configuration
const SUPABASE_URL = 'https://xbyywomrdepmbveideja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qzzc_9VfWz0yKf1mR4xL7sP2nQ5jH8gB';

let supabase = null;

// Initialize Supabase
async function initSupabase() {
    if (typeof window.supabase !== 'undefined' && !supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// Convert Word to PDF using mammoth + pdfmake
async function wordToPdf(file, articleTitle, author) {
    return new Promise(async (resolve, reject) => {
        try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Extract text from Word using mammoth
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const text = result.value;

            if (!text || text.trim().length === 0) {
                reject(new Error('无法提取 Word 内容 / Cannot extract Word content'));
                return;
            }

            // Load pdfmake dynamically
            if (typeof pdfMake === 'undefined') {
                await loadPdfMake();
            }

            // Create PDF document definition
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
                    title: {
                        fontSize: 22,
                        bold: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 20]
                    },
                    author: {
                        fontSize: 12,
                        alignment: 'center',
                        italics: true
                    },
                    heading: {
                        fontSize: 14,
                        bold: true
                    },
                    body: {
                        fontSize: 11,
                        lineHeight: 1.5,
                        textAlign: 'justify'
                    }
                },
                defaultStyle: {
                    font: 'Helvetica'
                }
            };

            // Generate PDF
            const pdfDocGenerator = pdfMake.createPdf(docDefinition);

            pdfDocGenerator.getBlob((blob) => {
                // Convert blob to File object with .pdf extension
                const pdfFile = new File([blob], file.name.replace('.docx', '.pdf'), {
                    type: 'application/pdf',
                    lastModified: new Date().getTime()
                });
                resolve(pdfFile);
            });

        } catch (error) {
            console.error('Word to PDF conversion error:', error);
            reject(error);
        }
    });
}

// Load pdfmake library dynamically
function loadPdfMake() {
    return new Promise((resolve, reject) => {
        if (typeof pdfMake !== 'undefined') {
            resolve();
            return;
        }

        // Load pdfmake
        const pdfMakeScript = document.createElement('script');
        pdfMakeScript.src = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/pdfmake.min.js';
        pdfMakeScript.onload = () => {
            // Load fonts
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

// Upload file to Supabase Storage
async function uploadToStorage(file, fileName) {
    const client = await initSupabase();

    if (!client) {
        throw new Error('Supabase 未初始化 / Supabase not initialized');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `papers/${timestamp}_${randomStr}_${safeFileName}`;

    try {
        // Upload file
        const { data, error } = await client.storage
            .from('papers')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (error) {
            console.error('Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = client.storage
            .from('papers')
            .getPublicUrl(filePath);

        return {
            path: data.path,
            url: urlData.publicUrl,
            fileName: file.name
        };

    } catch (error) {
        console.error('Storage upload error:', error);

        // Fallback: Store as base64 in localStorage
        return await saveToLocalStorage(file, fileName);
    }
}

// Fallback: Save file to localStorage as base64
async function saveToLocalStorage(file, fileName) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const data = {
                name: fileName,
                type: file.type,
                data: reader.result,
                timestamp: Date.now()
            };

            // Get existing files
            const existingFiles = JSON.parse(localStorage.getItem('hum_pdf_files') || '[]');
            existingFiles.push(data);

            // Keep only last 10 files to avoid localStorage limit
            if (existingFiles.length > 10) {
                existingFiles.shift();
            }

            localStorage.setItem('hum_pdf_files', JSON.stringify(existingFiles));

            // Return a blob URL as fallback
            const blobUrl = URL.createObjectURL(file);
            resolve({
                path: `local/${fileName}`,
                url: blobUrl,
                fileName: fileName,
                isLocal: true
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Full workflow: Word -> PDF -> Upload
async function processWordUpload(file, articleTitle, author) {
    try {
        // Step 1: Convert Word to PDF
        console.log('Converting Word to PDF...');
        const pdfFile = await wordToPdf(file, articleTitle, author);
        console.log('Word converted to PDF:', pdfFile.name);

        // Step 2: Upload to Supabase Storage
        console.log('Uploading PDF...');
        const uploadResult = await uploadToStorage(pdfFile, pdfFile.name);
        console.log('Upload complete:', uploadResult);

        return {
            success: true,
            pdfFile: pdfFile,
            ...uploadResult
        };

    } catch (error) {
        console.error('Process error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get file preview URL (for PDF viewing)
function getPreviewUrl(fileData) {
    if (fileData.isLocal && fileData.data) {
        // Convert base64 to blob URL
        const byteCharacters = atob(fileData.data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileData.type });
        return URL.createObjectURL(blob);
    }
    return fileData.url;
}

// Export functions
window.HUMUpload = {
    init: initSupabase,
    wordToPdf: wordToPdf,
    uploadToStorage: uploadToStorage,
    process: processWordUpload,
    getPreviewUrl: getPreviewUrl
};
