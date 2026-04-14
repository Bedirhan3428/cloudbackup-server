import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import configRoutes from './routes/config.js'
import logRoutes from './routes/logs.js'
import fileRouter, { uploadHandler } from './routes/files.js'
import agentRoutes from './routes/agents.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 10000
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
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

// Rotalar
app.use('/api/auth', authRoutes)
app.post('/api/files/upload', uploadHandler)

app.use('/api/:key/config', configRoutes)
app.use('/api/:key/logs', logRoutes)
app.use('/api/:key/files', fileRouter)
app.use('/api/:key', agentRoutes)

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'CloudBackup API Server Global Active',
    version: '3.0.0'
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('═'.repeat(50))
  console.log(`🚀 Sunucu Başarıyla Başlatıldı | Port: ${PORT}`)
  console.log('═'.repeat(50))
})
