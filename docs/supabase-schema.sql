-- Схема базы данных для каталога
-- Запустить в SQL Editor Supabase

-- Категории товаров
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Товары
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  article TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  old_price DECIMAL(10,2),
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Фото товаров (URL на Cloudinary)
CREATE TABLE product_photos (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Логи импорта Excel
CREATE TABLE import_logs (
  id SERIAL PRIMARY KEY,
  filename TEXT,
  rows_processed INT DEFAULT 0,
  rows_created INT DEFAULT 0,
  rows_updated INT DEFAULT 0,
  errors TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для скорости
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_article ON products(article);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_photos_product ON product_photos(product_id);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
