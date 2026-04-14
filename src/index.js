import express from 'express'
import cors    from 'cors'

import authRouter   from './routes/auth.js'
import configRouter from './routes/config.js'
import filesRouter  from './routes/files.js'
import agentsRouter from './routes/agents.js'
import logsRouter   from './routes/logs.js'

const app  = express()
const PORT = process.env.PORT ?? 5000

// ── CORS ─────────────────────────────────────────────────────
// ALLOWED_ORIGINS env var'a Vercel URL'ini ekle:
// ALLOWED_ORIGINS=https://cloudbackup.vercel.app,https://mycustomdomain.com
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Origin yoksa (curl, Postman, agent gibi server-to-server istekler) izin ver
    if (!origin) return cb(null, true)
    if (allowedOrigins.length === 0) return cb(null, true)   // env set edilmemişse herkese aç
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: ${origin} izin verilmedi`))
  },
  credentials: true,
}))

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.path}`)
  next()
})

// ── ROUTES ───────────────────────────────────────────────────
app.use('/api', authRouter)
app.use('/api', configRouter)
app.use('/api', filesRouter)
app.use('/api', agentsRouter)
app.use('/api', logsRouter)

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use((_req, res) => res.status(404).json({ error: 'Route bulunamadı' }))

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message ?? 'Sunucu hatası' })
})

// ── BAŞLAT ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═'.repeat(50))
  console.log(`  CloudBackup API Server`)
  console.log(`  http://localhost:${PORT}`)
  console.log(`  İzinli originler: ${allowedOrigins.join(', ') || 'hepsi'}`)
  console.log('═'.repeat(50))
})
