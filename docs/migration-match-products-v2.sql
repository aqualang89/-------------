-- ============================================================
-- Обновление match_products: возвращает id, slug, photo (для useCart)
-- Запустить в Supabase SQL Editor.
-- DROP + CREATE — старая функция удаляется, создаётся новая с тем же именем.
-- Embedding-данные в products НЕ затрагиваются — функция отдельная от данных.
-- ============================================================

DROP FUNCTION IF EXISTS match_products(vector, int);
DROP FUNCTION IF EXISTS match_products(vector, integer);

CREATE FUNCTION match_products(
  query_embedding vector(768),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id int,
  name text,
  article text,
  price decimal(10,2),
  slug text,
  photo text,
  is_available boolean,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.article,
    p.price,
    p.slug,
    (
      SELECT pp.url
      FROM product_photos pp
      WHERE pp.product_id = p.id
      ORDER BY pp.is_main DESC, pp.sort_order ASC
      LIMIT 1
    ) AS photo,
    p.is_available,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE p.embedding IS NOT NULL
    AND p.is_available = TRUE
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;
