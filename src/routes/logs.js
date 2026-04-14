import { Router } from 'express'
import { requireKey } from '../helpers.js'
import { appendLog, getLogs } from '../accounts.js'

const router = Router({ mergeParams: true })

function classify(line) {
  if (line.includes('[ERROR]') || line.includes('❌')) return 'error'
  if (line.includes('[WARNING]') || line.includes('⚠️')) return 'warn'
  if (line.includes('☁️') || line.includes('✅'))         return 'success'
  if (line.includes('🤖'))                                return 'ai'
  if (line.includes('⏭️'))                               return 'skip'
  return 'info'
}

// GET /api/:key/logs
router.get('/', requireKey, async (req, res) => {
  try {
    const n    = Math.min(parseInt(req.query.lines ?? 100), 500)
    const lines = await getLogs(req.params.key, n)
    res.json({
      logs: lines.map(text => ({ text, level: classify(text) }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/:key/logs
router.post('/', requireKey, async (req, res) => {
  try {
    const { line } = req.body
    if (!line) return res.json({ ok: false })
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
    await appendLog(req.params.key, `${ts} ${line}`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
