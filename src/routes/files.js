import { Router } from 'express'
import path from 'path'
import { requireKey, humanSize, extIcon } from '../helpers.js'
import { loadConfig } from '../accounts.js'
import { getBucket } from '../firebase.js'

const router = Router({ mergeParams: true })

async function getBucketForKey(key) {
  try {
    const cfg = await loadConfig(key)
    return getBucket(cfg.firebase?.storage_bucket)
  } catch {
    return null
  }
}

// GET /api/:key/files
router.get('/', requireKey, async (req, res) => {
  const bucket = await getBucketForKey(req.params.key)
  if (!bucket) return res.status(503).json({ error: 'Firebase bağlantı hatası' })

  try {
    const { search = '', ext = '', page = 1, per_page = 50 } = req.query
    const [blobs] = await bucket.getFiles()

    let files = []
    let totalSize = 0

    for (const blob of blobs) {
      const name = path.basename(blob.name)
      if (search && !blob.name.toLowerCase().includes(search.toLowerCase())) continue
      if (ext && !name.toLowerCase().endsWith(ext.toLowerCase())) continue

      const meta = blob.metadata?.metadata ?? {}
      const size = parseInt(blob.metadata?.size ?? 0)

      files.push({
        icon: extIcon(name),
        name,
        path: blob.name,
        size,
        size_human: humanSize(size),
        updated: blob.metadata?.updated ?? null,
        backup_time: meta.backup_time ?? null,
        original_path: meta.original_path ?? '',
        machine: meta.source_machine ?? '—',
        ai_reason: meta.ai_reason ?? '',
        ai_confidence: meta.ai_confidence ?? '',
        source_label: meta.source_label ?? '',
      })
      totalSize += size
    }

    files.sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))

    const extStats = {}
    for (const f of files) {
      const e = path.extname(f.name).toLowerCase() || 'diğer'
      extStats[e] = (extStats[e] ?? 0) + 1
    }
    const sortedExt = Object.fromEntries(
      Object.entries(extStats).sort((a, b) => b[1] - a[1]).slice(0, 10)
    )

    const p = parseInt(page)
    const pp = parseInt(per_page)
    const start = (p - 1) * pp

    res.json({
      files: files.slice(start, start + pp),
      total: files.length,
      page: p,
      per_page: pp,
      total_size: totalSize,
      total_size_human: humanSize(totalSize),
      ext_stats: sortedExt,
    })
  } catch (err) {
    console.error('[FILES]', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/:key/files/delete
router.delete('/delete', requireKey, async (req, res) => {
  const bucket = await getBucketForKey(req.params.key)
  if (!bucket) return res.status(503).json({ error: 'Firebase yok' })

  try {
    const { path: filePath } = req.body
    await bucket.file(filePath).delete()
    console.log(`[DEL] ${req.params.key.slice(0, 8)}: ${filePath}`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPLOAD Handler (index.js tarafından /api/files/upload için kullanılır)
export const uploadHandler = async (req, res) => {
  try {
    const { key, filename, content, path: filePath } = req.body
    if (!key || !filename || !content) return res.status(400).json({ error: 'Eksik veri' })

    const bucket = await getBucketForKey(key)
    if (!bucket) return res.status(503).json({ error: 'Firebase Storage erişilemez' })

    const file = bucket.file(`backups/${key}/${filename}`)
    await file.save(content, {
      metadata: {
        metadata: {
          backup_time: new Date().toISOString(),
          original_path: filePath || ''
        }
      }
    })

    res.json({ ok: true, message: 'Dosya başarıyla yüklendi' })
  } catch (err) {
    console.error('[UPLOAD ERROR]', err)
    res.status(500).json({ error: err.message })
  }
}

export default router
