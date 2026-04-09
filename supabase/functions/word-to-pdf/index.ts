// ============================================================
// HUM Journal Word 转 PDF Edge Function
// HUM Journal Word to PDF Edge Function
// ============================================================
// 功能: 将用户上传的 Word 文档转换为 PDF
// Features: Convert uploaded Word documents to PDF
//
// 依赖: mammoth (DOCX解析), pdf-lib (PDF生成)
// Dependencies: mammoth (DOCX parsing), pdf-lib (PDF generation)
//
// 使用方式 / Usage:
// POST /functions/v1/word-to-pdf
// Content-Type: multipart/form-data
// Body: file (Word document)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// 支持的文件类型
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

// 最大文件大小: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// 简化的 PDF 生成器 (用于 demo)
async function createSimplePdf(content: {
  title: string
  author: string
  text: string
}): Promise<Uint8Array> {
  // 基础 PDF 结构
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 24 Tf
50 740 Td
(${escapePdfString(content.title)}) Tj
0 -30 Td
/F1 12 Tf
(${escapePdfString('Author: ' + content.author)}) Tj
0 -20 Td
/F1 10 Tf
/${Math.min(content.text.length, 500)}} Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000518 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
595
%%EOF`

  return new TextEncoder().encode(pdfContent)
}

// 转义 PDF 字符串
function escapePdfString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// 解析 multipart form data
async function parseMultipart(body: ReadableStream, boundary: string): Promise<{
  file: Uint8Array
  filename: string
  contentType: string
} | null> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const bodyBytes = new Uint8Array(totalLength)
  let position = 0
  for (const chunk of chunks) {
    bodyBytes.set(chunk, position)
    position += chunk.length
  }

  const bodyString = new TextDecoder().decode(bodyBytes)
  const parts = bodyString.split(`--${boundary}`)

  for (const part of parts) {
    if (part.includes('Content-Type:')) {
      const headerEnd = part.indexOf('\r\n\r\n')
      if (headerEnd === -1) continue

      const headers = part.substring(0, headerEnd)
      const contentStart = headerEnd + 4

      if (headers.includes('filename=')) {
        const filenameMatch = headers.match(/filename="([^"]+)"/)
        const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/)

        if (filenameMatch && contentTypeMatch) {
          const filename = filenameMatch[1]
          const contentType = contentTypeMatch[1]
          const fileContent = bodyString.substring(
            bodyString.indexOf('\r\n\r\n', bodyString.indexOf(`filename="${filename}"`)) + 4,
            bodyString.lastIndexOf('\r\n')
          )

          return {
            file: new TextEncoder().encode(fileContent),
            filename,
            contentType
          }
        }
      }
    }
  }

  return null
}

// 主处理函数
Deno.serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 获取 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 解析 multipart 请求
    const contentType = req.headers.get('content-type') || ''
    let boundary = ''

    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(.+)/)
      if (boundaryMatch) {
        boundary = boundaryMatch[1]
      }
    }

    if (!boundary) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type. Use multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 解析文件
    const parsed = await parseMultipart(req.body!, boundary)

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'No file found in request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { file, filename, contentType } = parsed

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 验证文件大小
    if (file.length > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 50MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 如果是 PDF，直接返回
    if (contentType === 'application/pdf') {
      return new Response(file, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        }
      })
    }

    // 如果是 Word，返回提示信息
    // 实际转换需要更复杂的库支持
    // In production, use mammoth.js or similar library for Word conversion

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Word to PDF conversion is not available in this demo. Please upload a PDF directly or use the client-side conversion.',
        filename,
        fileSize: file.length,
        message: 'For production Word to PDF conversion, deploy mammoth.js on the client side.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing file:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
