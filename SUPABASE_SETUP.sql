-- ============================================================
-- HUM Journal 数据库配置
-- 运行方式: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. 创建 articles 表
CREATE TABLE IF NOT EXISTS public.articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    email TEXT,
    abstract TEXT,
    keywords TEXT,
    content TEXT,
    category TEXT DEFAULT 'public' CHECK (category IN ('public', 'academic')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'unpublished')),
    file_url TEXT,
    file_name TEXT,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- 2. 启用 RLS (Row Level Security)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略 - 允许所有人读取
CREATE POLICY "Allow public read" ON public.articles
    FOR SELECT USING (true);

-- 4. 创建 RLS 策略 - 允许匿名插入
CREATE POLICY "Allow public insert" ON public.articles
    FOR INSERT WITH CHECK (true);

-- 5. 创建 RLS 策略 - 允许更新 (按需)
CREATE POLICY "Allow public update" ON public.articles
    FOR UPDATE USING (true);

-- 6. 创建 RLS 策略 - 允许删除
CREATE POLICY "Allow public delete" ON public.articles
    FOR DELETE USING (true);

-- ============================================================
-- Storage 配置
-- ============================================================

-- 1. 创建 storage.buckets 记录 (如果不存在)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('papers', 'papers', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. 启用 RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. 创建 Storage 策略 - 允许公开访问
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'papers');

CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'papers');

CREATE POLICY "Allow public delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'papers');

CREATE POLICY "Allow public update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'papers');

-- ============================================================
-- 创建索引以提升查询性能
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);

-- ============================================================
-- 验证配置
-- ============================================================
SELECT 'Setup Complete!' as status;
SELECT * FROM public.articles LIMIT 1;
