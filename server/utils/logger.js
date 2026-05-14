import { randomUUID } from 'node:crypto'

// Простой structured logger с requestId.
// Использование в начале handler:
//   const log = createLogger(event, 'order')
//   log.info('Creating order')
//   log.error('Insert failed', err)
//
// Если запрос упал — в логах Vercel видно [order:abc12345] и связано всё что относилось к этому запросу.
// requestId возвращается клиенту в errors чтобы он мог сообщить ID при поддержке.

export function createLogger(event, scope = 'api') {
  const requestId = randomUUID().slice(0, 8)

  const prefix = `[${scope}:${requestId}]`

  return {
    requestId,
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  }
}
