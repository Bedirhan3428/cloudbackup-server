import { keyExists } from './accounts.js'

// Key doğrulama middleware — Firestore async
export function requireKey(req, res, next) {
  const key = req.params.key
  if (!key) return res.status(401).json({ error: 'Key eksik' })
  
  keyExists(key)
    .then(exists => exists ? next() : res.status(401).json({ error: 'Geçersiz key' }))
    .catch((err) => {
      // Hata Render konsoluna yazdırılıyor
      console.error(`[Auth Hatası] Key kontrolü başarısız:`, err.message);
      res.status(500).json({ error: 'Auth hatası: ' + err.message })
    })
}

// Dosya boyutunu insan okunabilir yapar
export function humanSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}

// Dosya türüne göre emoji
export function extIcon(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  const map = {
    pdf:'📄', docx:'📝', doc:'📝', xlsx:'📊', xls:'📊', pptx:'📊', csv:'📊',
    jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', webp:'🖼️',
    mp4:'🎬', mov:'🎬', avi:'🎬', mp3:'🎵', wav:'🎵',
    zip:'🗜️', rar:'🗜️', '7z':'🗜️',
    py:'🐍', js:'📜', ts:'📜', jsx:'📜', tsx:'📜',
    html:'🌐', css:'🎨', json:'⚙️', txt:'📃', sql:'🗄️', db:'🗄️',
    sh:'💻', bat:'💻',
  }
  return map[ext] ?? '📁'
}
