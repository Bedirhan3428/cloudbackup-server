// src backend/routes/config.js
import { Router } from 'express'
import { requireKey } from '../helpers.js'
import { loadConfig, saveConfig } from '../accounts.js'

// mergeParams: true eklemek şart!
const router = Router({ mergeParams: true }) 

// Artık yol sadece '/' çünkü index.js'de /api/:key/config tanımlandı
router.get('/', requireKey, async (req, res) => {
  try {
    res.json(await loadConfig(req.params.key))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireKey, async (req, res) => {
  try {
    const key = req.params.key
    const cfg = await loadConfig(key)
    Object.assign(cfg, req.body)
    await saveConfig(key, cfg)
    res.json({ ok: true, config: cfg })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
