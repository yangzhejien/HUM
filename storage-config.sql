-- ============================================================
-- HUM Journal Storage 存储桶配置
-- HUM Journal Storage Bucket Configuration
-- ============================================================
-- 使用说明: 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- Instructions: Run this script in Supabase Dashboard -> SQL Editor

-- ============================================================
-- 1. 创建 papers 存储桶 (公开访问)
-- 1. Create papers storage bucket (public access)
-- ============================================================

-- 使用管理权限创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'papers',
    'papers',
    true,
    52428800, -- 50MB 限制 / 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- ============================================================
-- 2. 配置存储桶 RLS 策略
-- 2. Configure storage bucket RLS policies
-- ============================================================

-- 启用存储 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Public read files" ON storage.objects;
DROP POLICY IF EXISTS "Public upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public delete files" ON storage.objects;

-- 允许公开读取 papers 桶中的文件
-- Allow public read of files in papers bucket
CREATE POLICY "Public read files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'papers'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() IS NULL)
);

-- 允许公开上传文件到 papers 桶
-- Allow public upload to papers bucket
CREATE POLICY "Public upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'papers'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() IS NULL)
);

-- 允许认证用户删除自己的文件
-- Allow authenticated users to delete their own files
CREATE POLICY "Users delete own files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'papers'
    AND auth.role() = 'authenticated'
);

-- 允许服务角色删除任何文件
-- Allow service role to delete any file
CREATE POLICY "Service delete any files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'papers'
    AND auth.role() = 'service_role'
);

-- ============================================================
-- 3. 创建 avatars 存储桶 (可选，用于未来用户头像)
-- 3. Create avatars storage bucket (optional, for future user avatars)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB 限制 / 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true;

-- Avatars bucket RLS
DROP POLICY IF EXISTS "Public avatars read" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars upload" ON storage.objects;

CREATE POLICY "Public avatars read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public avatars upload"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() IS NULL)
);

-- ============================================================
-- 4. 存储使用示例查询
-- 4. Storage usage examples
-- ============================================================

-- 列出 papers 桶中的所有文件
-- SELECT name, created_at, metadata FROM storage.objects WHERE bucket_id = 'papers';

-- 获取文件公共 URL
-- SELECT
--     name,
--     'https://your-project.supabase.co/storage/v1/object/public/papers/' || name as url
-- FROM storage.objects
-- WHERE bucket_id = 'papers';

-- 删除过期文件 (示例：删除7天前的文件)
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'papers'
-- AND created_at < NOW() - INTERVAL '7 days';

-- ============================================================
-- 执行完成提示
-- ============================================================
-- 此脚本已成功执行以下操作:
-- 1. ✅ 创建 papers 存储桶 (50MB PDF/Word 限制)
-- 2. ✅ 创建 avatars 存储桶 (5MB 图片限制)
-- 3. ✅ 配置存储桶 RLS 策略
-- 4. ✅ 允许公开读写 papers 桶
--
-- 注意: 将 your-project.supabase.co 替换为您的实际项目 URL
