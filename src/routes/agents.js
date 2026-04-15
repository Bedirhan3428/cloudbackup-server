import { Router } from 'express'
import path       from 'path'
import { requireKey, humanSize } from '../helpers.js'
import { loadConfig, loadAgents, saveAgents, loadSelfDestruct, saveSelfDestruct } from '../accounts.js'
import { getBucket } from '../firebase.js'

const router = Router({ mergeParams: true }) // KRİTİK: index.js'den key'i çeker

// GET /api/:key/agents
router.get('/agents', requireKey, async (req, res) => {
  try {
    const agents = await loadAgents(req.params.key)
    const now    = Date.now()

    const list = Object.values(agents).map(a => ({
      ...a,
      online: a.last_seen
        ? (now - new Date(a.last_seen).getTime()) < 90_000
        : false,
    }))

    res.json({ agents: list })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/:key/agents/ping
router.post('/agents/ping', requireKey, async (req, res) => {
  try {
    const key     = req.params.key
    const data    = req.body
    const machine = data.machine_name ?? 'PC'
    const agents  = await loadAgents(key)

    if (!agents[machine]) agents[machine] = { files_uploaded: 0, ai_skipped: 0 }

    agents[machine] = {
      ...agents[machine],
      online:         true,
      last_seen:      new Date().toISOString(),
      machine_name:   machine,
      files_uploaded: data.files_uploaded ?? agents[machine].files_uploaded,
      ai_skipped:     data.ai_skipped     ?? agents[machine].ai_skipped ?? 0,
      last_file:      data.last_file      ?? null,
      uptime_seconds: data.uptime_seconds ?? 0,
      directory_map:  data.directory_map  ?? agents[machine].directory_map ?? null,
    }

    await saveAgents(key, agents)

    const config = await loadConfig(key)

    // Self-destruct komutu var mı kontrol et
    const sd = await loadSelfDestruct(key)
    let selfDestructCmd = null
    if (sd && sd[machine] && sd[machine].status === 'pending') {
      selfDestructCmd = { command: 'self_destruct', issued_at: sd[machine].issued_at }
      // Durumu 'acknowledged' olarak güncelle
      sd[machine].status = 'acknowledged'
      sd[machine].acknowledged_at = new Date().toISOString()
      await saveSelfDestruct(key, sd)
    }

    res.json({ config, self_destruct: selfDestructCmd })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/:key/stats
router.get('/stats', requireKey, async (req, res) => {
  try {
    const agents = await loadAgents(req.params.key)
    let totalFiles = 0, totalSize = 0
    const extStats = {}

    const cfg    = await loadConfig(req.params.key)
    const bucket = getBucket(cfg.firebase?.storage_bucket)

    if (bucket) {
      const [blobs] = await bucket.getFiles()
      for (const b of blobs) {
        totalFiles++
        totalSize += parseInt(b.metadata?.size ?? 0)
        const e = path.extname(path.basename(b.name)).toLowerCase() || 'diğer'
        extStats[e] = (extStats[e] ?? 0) + 1
      }
    }

    const sortedExt = Object.fromEntries(
      Object.entries(extStats).sort((a, b) => b[1] - a[1]).slice(0, 10)
    )

    res.json({
      total_files:      totalFiles,
      total_size:       totalSize,
      total_size_human: humanSize(totalSize),
      ext_stats:        sortedExt,
      agent_count:      Object.keys(agents).length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/:key/agents/self-destruct — İmha komutu gönder
router.post('/agents/self-destruct', requireKey, async (req, res) => {
  try {
    const key = req.params.key
    const { machine_name } = req.body
    if (!machine_name) return res.status(400).json({ error: 'machine_name gerekli' })

    const sd = await loadSelfDestruct(key) || {}
    sd[machine_name] = {
      status: 'pending',
      issued_at: new Date().toISOString(),
      acknowledged_at: null,
    }
    await saveSelfDestruct(key, sd)

    console.log(`[SELF-DESTRUCT] ${machine_name} için imha komutu verildi (key: ${key})`)
    res.json({ ok: true, message: `İmha komutu ${machine_name} için verildi.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/:key/agents/self-destruct — İmha komutunu iptal et
router.delete('/agents/self-destruct', requireKey, async (req, res) => {
  try {
    const key = req.params.key
    const { machine_name } = req.body
    if (!machine_name) return res.status(400).json({ error: 'machine_name gerekli' })

    const sd = await loadSelfDestruct(key) || {}
    if (sd[machine_name]) {
      delete sd[machine_name]
      await saveSelfDestruct(key, sd)
    }

    res.json({ ok: true, message: 'İmha komutu iptal edildi.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
