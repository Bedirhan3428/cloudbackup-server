import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

// Rotalar
import authRoutes from './routes/auth.js'
import configRoutes from './routes/config.js'
import logRoutes from './routes/logs.js'
import fileRoutes from './routes/files.js'
import agentRoutes from './routes/agents.js'

// ES Modül için __dirname alternatifi
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 1. KRİTİK AYAR: Render Port Yapılandırması
// Render portu dinamik atar, 10000 varsayılandır.
const PORT = process.env.PORT || 10000

// 2. CORS Yapılandırması
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Mobil uygulamalar veya curl isteklerinde origin boş gelebilir, buna izin veriyoruz
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS Error: Bu adresten erişim izni yok.'))
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))

// İstek Günlüğü (Hata ayıklama için kolaylık sağlar)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Rotaları Bağla
app.use('/api/auth', authRoutes);
app.use('/api/:key/config', configRoutes); // Değişti: /api/keys -> /api/:key/config
app.use('/api/:key/logs', logRoutes);     // Değişti: /api/logs -> /api/:key/logs
app.use('/api/:key/files', fileRoutes);   // Değişti: /api/files -> /api/:key/files
app.use('/api/:key/agents', agentRoutes); // Değişti: /api/agents -> /api/:key/agents

// Ana Sayfa Test Rootu
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'CloudBackup API Server Global Active',
    version: '3.0.0'
  })
})

// 3. KRİTİK AYAR: 0.0.0.0 Dinlemesi
// Render ve benzeri platformlar 'localhost' yerine '0.0.0.0' dinlemeni şart koşar.
app.listen(PORT, '0.0.0.0', () => {
  console.log('═'.repeat(50))
  console.log(`🚀 Sunucu Başarıyla Başlatıldı`)
  console.log(`📍 Port: ${PORT}`)
  console.log(`🌍 Mod: ${process.env.NODE_ENV || 'production'}`)
  console.log(`🔒 İzinli Originler: ${allowedOrigins.join(', ') || 'Hepsi'}`)
  console.log('═'.repeat(50))

  // Önemli Değişken Kontrolü
  if (!process.env.FIREBASE_CREDENTIALS && !process.env.FIREBASE_KEY_PATH) {
    console.error('⚠️ UYARI: FIREBASE_CREDENTIALS tanımlanmamış! Firebase işlemleri çalışmayacak.')
  }
  if (!process.env.MONGODB_URI) {
    console.error('⚠️ UYARI: MONGODB_URI tanımlanmamış! Veritabanı bağlantısı kurulamaz.')
  }
})
