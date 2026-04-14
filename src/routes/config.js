import { Router } from 'express'
import { requireKey } from '../helpers.js'
import { loadConfig, saveConfig } from '../accounts.js'

const router = Router()

router.get('/:key/config', requireKey, async (req, res) => {
  try {
    res.json(await loadConfig(req.params.key))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:key/config', requireKey, async (req, res) => {
  try {
    const key = req.params.key
    const cfg = await loadConfig(key)
    Object.assign(cfg, req.body)
    await saveConfig(key, cfg)
    console.log(`[Config] Güncellendi: ${key.slice(0,8)}`)
    res.json({ ok: true, config: cfg })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
