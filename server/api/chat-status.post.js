import { z } from 'zod'
import { getMode, popManualReplies } from '~/server/utils/store.js'
import { validateBody } from '~/server/utils/validate.js'

const schema = z.object({
  sessionId: z.string().min(1).max(100)
})

export default defineEventHandler(async (event) => {
  const { sessionId } = await validateBody(event, schema)

  const mode = await getMode(sessionId)
  const pending = await popManualReplies(sessionId)

  return { mode, pending }
})
