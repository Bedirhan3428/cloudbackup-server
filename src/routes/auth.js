import { Router } from 'express'
import crypto from 'crypto'
// Firestore veritabanı bağlantınızın burada import edildiğinden emin olun
// import { db } from '../firebase-config.js' 
import { keyExists, createAccount, listKeys } from '../accounts.js'

const router = Router()

/**
 * POST /api/auth
 * Gönderilen key'in geçerli olup olmadığını kontrol eder ve verileri döner.
 */
router.post('/auth', async (req, res) => {
  try {
    const key = (req.body.key ?? '').trim()
    if (!key) return res.status(400).json({ ok: false, error: 'Key boş olamaz' })

    // Firestore'dan dökümanı çekiyoruz
    const accountDoc = await db.collection('accounts').doc(key).get()

    if (accountDoc.exists) {
      // Eğer anahtar varsa verilerle birlikte başarılı dön
      res.json({ ok: true, data: accountDoc.data() })
    } else {
      res.status(401).json({ ok: false, error: 'Geçersiz veya bulunamayan anahtar!' })
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/**
 * POST /api/keys/create
 * Rastgele bir key (CB-XXXX-XXXX-XXXX) ve varsayılan konfigürasyon oluşturur.
 */
router.post('/keys/create', async (req, res) => {
  try {
    const {
      machine_name = 'PC',
      server_url = '',
      storage_bucket = '',
      groq_api_key = '',
      watch_paths = [],
    } = req.body

    // Rastgele Key Oluşturma (Format: CB-A1B2-C3D4-E5F6)
    const key = 'CB-' + [1, 2, 3]
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
        '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx',
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.txt', '.csv', '.json', '.xml', '.yaml',
        '.py', '.js', '.ts', '.html', '.css', '.sql',
        '.zip', '.rar', '.7z', '.mp4', '.mov',
      ],
      blocked_extensions: ['.exe', '.dll', '.sys', '.msi', '.tmp', '.temp'],
      max_file_size_mb: 50,
      flash_enabled: true,
      flash_max_mb: 10,
      debounce_seconds: 2,
      sync_on_start: false,
      delete_on_remove: false,
      created_at: new Date().toISOString()
    }

    await createAccount(key, defaultConfig)
    res.json({ ok: true, key })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/**
 * GET /api/keys/list
 * Mevcut tüm anahtarları listeler.
 */
router.get('/keys/list', async (_req, res) => {
  try {
    const keys = await listKeys()
    res.json({ ok: true, keys })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

export default router
