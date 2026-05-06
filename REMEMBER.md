# 🧠 ВСПОМНИ МЕНЯ (Scaper's House)

## Для Макса: скопируй эту строку в новое окно Kimi и отправь:

```
Вспомни меня
```

## Что произойдёт:

Я прочитаю всю глобальную память (Kimi + Claude) и скажу:
> "Привет, Макс! Готов работать. Помню всё. Чем займёмся?"

## Технические детали (для меня):

При команде "Вспомни меня" я выполняю:
1. ReadFile `C:\Users\Татьяна\.kimi\memory.md` — общая память Kimi
2. ReadFile `C:\Users\Татьяна\.kimi\CLAUDE.md` — правила и контекст Kimi
3. ReadFile `C:\Users\Татьяна\.kimi\REMEMBER.md` — эта инструкция (глобальная)
4. ReadFile `C:\Users\Татьяна\.kimi\memory\user_profile.md` — профиль Макса
5. ReadFile `C:\Users\Татьяна\.claude\CLAUDE.md` — глобальные инструкции Claude
6. ReadFile `C:\Users\Татьяна\.claude\projects\c--Users---------Projects---------------main\memory\MEMORY.md` — проектная память Claude
7. ReadFile `PROJECT_CONTEXT.md` — архитектура проекта
8. ReadFile `PROJECT_STATE.md` — статус проекта
9. ReadFile `STATE.md` — решения и блокеры

**Проектные файлы (`project_*.md`) НЕ читаю** — только когда Макс скажет "вспомни проект" или "открой проект X".

---
*Обновлено: 2026-05-04*
