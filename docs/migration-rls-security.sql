-- ============================================================
-- Critical security fix: включить RLS на ВСЕХ таблицах public
-- Запустить в Supabase SQL Editor одним блоком
--
-- Почему это безопасно для нашего приложения:
-- - Все запросы идут через /api/* endpoints на бэке
-- - Бэк использует SUPABASE_SERVICE_KEY (service_role)
-- - service_role ОБХОДИТ RLS — все наши endpoints продолжат работать
-- - Анонимный клиент (anon key, видный в браузере) перестанет
--   иметь доступ к таблицам — это и есть цель
--
-- Что закрывается:
-- - Утечка orders (имена, телефоны, адреса, суммы заказов)
-- - Утечка order_items
-- - Возможность анона менять/удалять products, categories
-- - Все остальные таблицы в public
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'RLS enabled on: %', r.tablename;
  END LOOP;
END $$;

-- Проверка после запуска:
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--   Все rowsecurity должны быть = true
