// HTML escape для пользовательских данных в email-шаблонах (Resend и т.п.).
// Без этого имя/комментарий с `<script>` или `<img onerror>` срабатывают в почтовом клиенте.
export function escapeHtml (s) {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
