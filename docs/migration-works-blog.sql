-- ============================================================
-- Таблицы для разделов "Наши работы" (кейсы) и "Блог" (статьи Дмитрия).
-- Запустить в Supabase SQL Editor одним блоком.
--
-- RLS включён без policy для anon — как у остальных таблиц:
-- все запросы идут через /api/* с SUPABASE_SERVICE_KEY (обходит RLS),
-- анонимный клиент из браузера к таблицам напрямую доступа не имеет.
-- ============================================================

-- ── Наши работы (портфолио-кейсы) ──
create table if not exists public.works (
  id           bigint primary key generated always as identity,
  slug         text unique not null,
  title        text not null,
  description  text default '',          -- текст кейса (объём, что делали)
  cover_url    text,                      -- обложка для карточки
  photos       jsonb default '[]'::jsonb, -- массив url фото проекта
  is_published boolean default false,
  sort_order   int default 0,             -- ручной порядок (меньше = выше)
  created_at   timestamptz default now()
);
alter table public.works enable row level security;

-- ── Блог (авторские статьи) ──
create table if not exists public.articles (
  id           bigint primary key generated always as identity,
  slug         text unique not null,
  title        text not null,
  excerpt      text default '',     -- краткое описание для карточки и SEO
  cover_url    text,
  content      text default '',     -- текст статьи абзацами (перенос = новый абзац)
  is_published boolean default false,
  created_at   timestamptz default now(),
  published_at timestamptz
);
alter table public.articles enable row level security;

-- Сортировка/выборка опубликованного
create index if not exists works_published_idx on public.works (is_published, sort_order, created_at desc);
create index if not exists articles_published_idx on public.articles (is_published, published_at desc);
