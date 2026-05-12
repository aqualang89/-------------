-- ============================================================
-- pgvector + embeddings для умного поиска товаров
-- Запустить в Supabase SQL Editor одним блоком
-- Размерность 768 = выход gemini-embedding-001 при outputDimensionality=768
-- ============================================================

-- 1. Включить расширение pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Колонка для embedding в products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. HNSW индекс для быстрого поиска (cosine distance)
CREATE INDEX IF NOT EXISTS idx_products_embedding
  ON products
  USING hnsw (embedding vector_cosine_ops);

-- 4. Функция поиска: возвращает топ-N товаров по близости вектора
-- Используется через supabase.rpc('match_products', { query_embedding, match_count })
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  name text,
  article text,
  price decimal(10,2),
  slug text,
  is_available boolean,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.name,
    p.article,
    p.price,
    p.slug,
    p.is_available,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE p.embedding IS NOT NULL
    AND p.is_available = TRUE
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- ПРОВЕРКА после запуска:
--   SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'products' AND column_name = 'embedding';
-- ============================================================
