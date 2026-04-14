/**
 * start.cjs — Bootstrap dosyası
 * CommonJS olduğu için dotenv'i ESM modülleri yüklenmeden ÖNCE okur.
 * Kullanım: node start.cjs
 */

const path = require('path')
const fs   = require('fs')

// .env'i birkaç farklı yerde ara
const candidates = [
  path.join(__dirname, '.env'),          // server/.env
  path.join(__dirname, '..', '.env'),    // server/../.env  (bir üst klasör)
  path.join(process.cwd(), '.env'),      // çalışılan klasör
]

let loaded = false
for (const p of candidates) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p })
    console.log(`[dotenv] Yüklendi: ${p}`)
    loaded = true
    break
  }
}

if (!loaded) {
  console.warn('[dotenv] .env bulunamadı, sistem env var kullanılıyor')
}

// Kontrol
const checks = ['MONGODB_URI', 'FIREBASE_CREDENTIALS', 'ALLOWED_ORIGINS']
for (const key of checks) {
  const val = process.env[key]
  console.log(`[env] ${key}: ${val ? '✓ var' : '✗ YOK'}`)
}

// ESM index.js'i başlat
import('./src/index.js').catch(err => {
  console.error('[FATAL] Başlatma hatası:', err)
  process.exit(1)
})
