import { Router } from 'express'
import crypto     from 'crypto'
import { keyExists, createAccount, listKeys } from '../accounts.js'

const router = Router()

// POST /api/auth
router.post('/auth', async (req, res) => {
  try {
    const key = (req.body.key ?? '').trim()
    if (!key) return res.json({ ok: false, error: 'Key boş' })
    const exists = await keyExists(key)
    if (exists) return res.json({ ok: true })
    return res.json({ ok: false, error: 'Geçersiz key' })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/keys/create
router.post('/keys/create', async (req, res) => {
  try {
    const {
      machine_name = 'PC',
      server_url = '',
      storage_bucket = '',
      groq_api_key = '',
      watch_paths = [],
    } = req.body

    const key = 'CB-' + [1,2,3]
      .map(() => crypto.randomBytes(2).toString('hex').toUpperCase())
      .join('-')

    const defaultConfig = {
      machine_name,
      server_url: server_url || `https://${process.env.RENDER_EXTERNAL_HOSTNAME ?? 'localhost:5000'}`,
      firebase: { storage_bucket, credentials_path: 'firebase-credentials.json' },
      groq_api_key,
      ai_filter_enabled: true,
      ai_model: 'llama-3.3-70b-versatile',
      watch_paths,
      allowed_extensions: [
        '.pdf','.docx','.doc','.xlsx','.xls','.pptx',
        '.jpg','.jpeg','.png','.gif','.webp',
        '.txt','.csv','.json','.xml','.yaml',
        '.py','.js','.ts','.html','.css','.sql',
        '.zip','.rar','.7z','.mp4','.mov',
      ],
      blocked_extensions: ['.exe','.dll','.sys','.msi','.tmp','.temp'],
      max_file_size_mb: 50,
      flash_enabled: true,
      flash_max_mb: 10,
      debounce_seconds: 2,
      sync_on_start: false,
      delete_on_remove: false,
    }

    await createAccount(key, defaultConfig)
    res.json({ ok: true, key })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/keys/list
router.get('/keys/list', async (_req, res) => {
  try {
    const keys = await listKeys()
    res.json({ keys })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
