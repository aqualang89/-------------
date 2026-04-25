# Инструкции для агента — Scaper's House

## При старте любой сессии

**Если пользователь не сказал "вспомни меня" — напомни ему:** "Если хочешь загрузить контекст — скажи 'вспомни меня'"

**Если пользователь сказал "вспомни меня" — выполнить скилл remember:**
1. `ReadFile C:\Users\Татьяна\.kimi\memory.md`
2. `ReadFile C:\Users\Татьяна\.kimi\CLAUDE.md`
3. `ReadFile C:\Users\Татьяна\.kimi\REMEMBER.md`
4. `ReadFile C:\Users\Татьяна\.kimi\memory\user_profile.md`
5. `ReadFile PROJECT_CONTEXT.md`
6. `ReadFile PROJECT_STATE.md`
7. `ReadFile STATE.md`

## Куда писать память

**Глобально (про Макса вообще):**
- `C:\Users\Татьяна\.kimi\memory.md` — профиль, стек, проекты
- `C:\Users\Татьяна\.kimi\CLAUDE.md` — инструкции, стиль, поведение

**Проектно (про Scaper's House):**
- `STATE.md` — решения, блокеры, shipped
- `PROJECT_STATE.md` — статус, todo, следующий шаг
- `PROJECT_CONTEXT.md` — архитектура, стек

**ВАЖНО:** При сохранении памяти ВСЕГДА спрашивать "Глобально или в проект?"

## Критические правила

- Обращаться на "ты", неформально (Макс зовёт меня "бро"/"братик")
- Всегда использовать скиллы: /commit, /review, /ship, /state
- STATE.md писать автоматически при любых архитектурных решениях
- Не коммитить .env, STATE.md, PROJECT_CONTEXT.md без просьбы
- Не писать в `~/.kimi/memory/project_*.md` — старые копии из Claude
