-- ============================================================
-- HUM Journal Supabase 完整配置脚本
-- HUM Journal Supabase Complete Configuration Script
-- ============================================================
-- 使用说明: 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- Instructions: Run this script in Supabase Dashboard -> SQL Editor

-- ============================================================
-- 1. 创建 articles 表 (如果不存在)
-- 1. Create articles table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    email TEXT,
    category TEXT NOT NULL DEFAULT 'public' CHECK (category IN ('public', 'academic')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'unpublished')),
    content TEXT,
    abstract TEXT,
    keywords TEXT,
    file_url TEXT,
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ============================================================
-- 2. 添加注释和默认值
-- 2. Add comments and default values
-- ============================================================

COMMENT ON TABLE public.articles IS 'HUM Journal 论文表 / Articles table for HUM Journal';
COMMENT ON COLUMN public.articles.id IS '唯一标识符 / Unique identifier';
COMMENT ON COLUMN public.articles.title IS '文章标题 / Article title';
COMMENT ON COLUMN public.articles.author IS '作者姓名 / Author name';
COMMENT ON COLUMN public.articles.email IS '作者邮箱 / Author email';
COMMENT ON COLUMN public.articles.category IS '分类: public(大众刊) 或 academic(专业刊) / Category: public or academic';
COMMENT ON COLUMN public.articles.status IS '状态: pending(待审核), published(已发布), unpublished(未发布) / Status: pending, published, unpublished';
COMMENT ON COLUMN public.articles.content IS '文章内容 / Article content';
COMMENT ON COLUMN public.articles.abstract IS '摘要 / Abstract';
COMMENT ON COLUMN public.articles.keywords IS '关键词 / Keywords';
COMMENT ON COLUMN public.articles.file_url IS '文件公共访问URL / File public access URL';
COMMENT ON COLUMN public.articles.file_name IS '原始文件名 / Original file name';
COMMENT ON COLUMN public.articles.file_path IS '存储路径 / Storage path';
COMMENT ON COLUMN public.articles.file_size IS '文件大小(字节) / File size in bytes';
COMMENT ON COLUMN public.articles.created_at IS '创建时间 / Creation time';
COMMENT ON COLUMN public.articles.updated_at IS '更新时间 / Update time';
COMMENT ON COLUMN public.articles.published_at IS '发布时间 / Publication time';

-- ============================================================
-- 3. 创建索引以提高查询性能
-- 3. Create indexes for better query performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_status ON public.articles(category, status);

-- ============================================================
-- 4. 配置行级安全策略 (RLS)
-- 4. Configure Row Level Security (RLS)
-- ============================================================

-- 启用 RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow public read" ON public.articles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.articles;
DROP POLICY IF EXISTS "Allow admin update" ON public.articles;
DROP POLICY IF EXISTS "Allow admin delete" ON public.articles;

-- 公开读取策略 - 任何人都可以查看已发布的文章
-- Public read policy - Anyone can view published articles
CREATE POLICY "Allow public read"
ON public.articles
FOR SELECT
USING (
    status = 'published'
    OR auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
);

-- 公开插入策略 - 允许任何人插入新文章（投稿功能）
-- Public insert policy - Allow anyone to insert new articles (submission)
CREATE POLICY "Allow public insert"
ON public.articles
FOR INSERT
WITH CHECK (true);

-- 管理员更新策略 - 仅允许认证用户更新
-- Admin update policy - Only authenticated users can update
CREATE POLICY "Allow authenticated update"
ON public.articles
FOR UPDATE
USING (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
);

-- 管理员删除策略 - 仅允许服务角色删除
-- Admin delete policy - Only service role can delete
CREATE POLICY "Allow service delete"
ON public.articles
FOR DELETE
USING (
    auth.role() = 'service_role'
);

-- ============================================================
-- 5. 创建更新触发器 (自动更新 updated_at)
-- 5. Create update trigger (auto update updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 验证表结构和数据
-- 6. Verify table structure and data
-- ============================================================

-- 查看表结构
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'articles'
-- ORDER BY ordinal_position;

-- 查看现有数据数量
-- SELECT COUNT(*) as total_count FROM public.articles;

-- ============================================================
-- 7. 存储桶配置 (需要在 Supabase Dashboard -> Storage 中手动配置)
-- 7. Storage bucket config (Manual config in Supabase Dashboard -> Storage)
-- ============================================================
--
-- 建议在 Storage 中创建以下桶:
-- 1. papers (公开) - 用于存储用户上传的论文
-- 2. avatars (公开) - 用于存储头像图片
--
-- 配置权限:
-- SELECT storage.create_bucket('papers', public => true);
-- SELECT storage.create_bucket('avatars', public => true);

-- ============================================================
-- 8. 常用查询示例
-- 8. Common query examples
-- ============================================================

-- 获取所有已发布的文章 (按时间倒序)
-- SELECT * FROM public.articles
-- WHERE status = 'published'
-- ORDER BY created_at DESC;

-- 获取大众刊已发布文章
-- SELECT * FROM public.articles
-- WHERE status = 'published' AND category = 'public'
-- ORDER BY created_at DESC;

-- 获取专业刊已发布文章
-- SELECT * FROM public.articles
-- WHERE status = 'published' AND category = 'academic'
-- ORDER BY created_at DESC;

-- 获取待审核文章
-- SELECT * FROM public.articles
-- WHERE status = 'pending'
-- ORDER BY created_at DESC;

-- 获取特定用户的文章
-- SELECT * FROM public.articles
-- WHERE email = 'user@example.com'
-- ORDER BY created_at DESC;

-- ============================================================
-- 9. 清理函数示例 (删除文章及关联文件)
-- 9. Cleanup function example (delete article and associated files)
-- ============================================================

-- 注意: 需要先创建 storage bucket 和配置权限后此函数才能正常工作
-- Note: This function requires storage bucket and permissions to be configured first

/*
CREATE OR REPLACE FUNCTION delete_article_with_file(article_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    file_path TEXT;
BEGIN
    -- 获取文件路径
    SELECT file_path INTO file_path
    FROM public.articles
    WHERE id = article_id;

    -- 删除存储文件 (如果有)
    IF file_path IS NOT NULL AND file_path != '' THEN
        -- 使用 service_role 权限删除文件
        PERFORM supabase.storage.from('papers').remove(file_path);
    END IF;

    -- 删除数据库记录
    DELETE FROM public.articles WHERE id = article_id;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ============================================================
-- 执行完成提示
-- ============================================================
-- 此脚本已成功执行以下操作:
-- 1. ✅ 创建/更新 articles 表结构
-- 2. ✅ 添加索引优化查询性能
-- 3. ✅ 配置行级安全策略 (RLS)
-- 4. ✅ 创建更新触发器
--
-- 后续步骤:
-- 1. 在 Storage 中创建 papers 桶并设置公开权限
-- 2. 配置存储桶的 RLS 策略允许上传和访问
-- 3. 运行前端代码测试完整功能
