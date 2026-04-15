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
    
    // SADECE BU KEY'E AİT DOSYALARI GETİRİR (Sigal Media'dan ayırır)
    const [blobs] = await bucket.getFiles({
      prefix: `backups/${req.params.key}/`
    })

    let files = []
    let totalSize = 0

    for (const blob of blobs) {
      // Sadece klasörün kendisini listelememesi için atlıyoruz
      if (blob.name.endsWith('/')) continue;

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

// GET /api/:key/files/browse?dir=...
router.get('/browse', requireKey, async (req, res) => {
  const bucket = await getBucketForKey(req.params.key)
  if (!bucket) return res.status(503).json({ error: 'Firebase bağlantı hatası' })

  try {
    const { dir = '' } = req.query

    const [blobs] = await bucket.getFiles({
      prefix: `backups/${req.params.key}/`
    })

    // Build a virtual filesystem from original_path metadata
    const folders = new Set()
    const filesAtDir = []
    let totalSize = 0

    for (const blob of blobs) {
      if (blob.name.endsWith('/')) continue

      const name = path.basename(blob.name)
      const meta = blob.metadata?.metadata ?? {}
      const originalPath = meta.original_path ?? ''
      const size = parseInt(blob.metadata?.size ?? 0)

      // Normalize path separators
      const normalized = originalPath.replace(/\//g, '\\')

      // Extract the directory part from original path
      const lastSep = normalized.lastIndexOf('\\')
      const fileDir = lastSep >= 0 ? normalized.substring(0, lastSep) : ''

      // Normalize current dir for comparison
      const normalizedDir = dir.replace(/\//g, '\\').replace(/\\$/, '')

      if (normalizedDir === '') {
        // Root level: show top-level drive/folder structure
        if (normalized.length > 0) {
          // Get the first path segment (e.g., "C:" from "C:\Users\...")
          const parts = normalized.split('\\').filter(Boolean)
          if (parts.length > 0) {
            if (parts.length > 1) {
              folders.add(parts[0])
            } else {
              // File at root level
              filesAtDir.push({
                icon: extIcon(name),
                name,
                path: blob.name,
                size,
                size_human: humanSize(size),
                updated: blob.metadata?.updated ?? null,
                backup_time: meta.backup_time ?? null,
                original_path: originalPath,
                machine: meta.source_machine ?? '—',
                ai_reason: meta.ai_reason ?? '',
                ai_confidence: meta.ai_confidence ?? '',
              })
            }
          }
        } else {
          // Files without original_path go to root
          filesAtDir.push({
            icon: extIcon(name),
            name,
            path: blob.name,
            size,
            size_human: humanSize(size),
            updated: blob.metadata?.updated ?? null,
            backup_time: meta.backup_time ?? null,
            original_path: originalPath,
            machine: meta.source_machine ?? '—',
            ai_reason: meta.ai_reason ?? '',
            ai_confidence: meta.ai_confidence ?? '',
          })
        }
        totalSize += size
      } else {
        // Check if this file is under the requested directory
        if (normalized.toLowerCase().startsWith(normalizedDir.toLowerCase() + '\\') || fileDir.toLowerCase() === normalizedDir.toLowerCase()) {
          totalSize += size

          if (fileDir.toLowerCase() === normalizedDir.toLowerCase()) {
            // File is directly in this directory
            filesAtDir.push({
              icon: extIcon(name),
              name,
              path: blob.name,
              size,
              size_human: humanSize(size),
              updated: blob.metadata?.updated ?? null,
              backup_time: meta.backup_time ?? null,
              original_path: originalPath,
              machine: meta.source_machine ?? '—',
              ai_reason: meta.ai_reason ?? '',
              ai_confidence: meta.ai_confidence ?? '',
            })
          } else {
            // File is in a subdirectory — extract the next folder name
            const remaining = normalized.substring(normalizedDir.length + 1)
            const nextFolder = remaining.split('\\')[0]
            if (nextFolder) {
              folders.add(nextFolder)
            }
          }
        }
      }
    }

    // Sort folders alphabetically, files by name
    const sortedFolders = [...folders].sort((a, b) => a.localeCompare(b, 'tr'))
    filesAtDir.sort((a, b) => a.name.localeCompare(b.name, 'tr'))

    res.json({
      current_dir: dir,
      folders: sortedFolders,
      files: filesAtDir,
      total_files: filesAtDir.length,
      total_folders: sortedFolders.length,
      total_size: totalSize,
      total_size_human: humanSize(totalSize),
    })
  } catch (err) {
    console.error('[BROWSE]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/:key/files/download?path=...
router.get('/download', requireKey, async (req, res) => {
  const bucket = await getBucketForKey(req.params.key)
  if (!bucket) return res.status(503).json({ error: 'Firebase bağlantı hatası' })

  try {
    const { path: filePath } = req.query
    if (!filePath) return res.status(400).json({ error: 'Dosya yolu eksik' })

    const file = bucket.file(filePath)
    const [exists] = await file.exists()
    if (!exists) return res.status(404).json({ error: 'Dosya bulunamadı' })

    // 15 dakikalık geçici indirme linki oluştur
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 dakika
    })

    res.json({ url })
  } catch (err) {
    console.error('[DOWNLOAD]', err)
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
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


export const uploadHandler = async (req, res) => {
  try {
    const { key, filename, content, path: filePath, encoding,
            machine_name, ai_reason, ai_confidence, source_label, file_hash } = req.body
    if (!key) return res.status(400).json({ error: 'Eksik veri: key' })
    if (!filename) return res.status(400).json({ error: 'Eksik veri: filename' })
    if (content === undefined) return res.status(400).json({ error: 'Eksik veri: content' })

    const bucket = await getBucketForKey(key)
    if (!bucket) return res.status(503).json({ error: 'Firebase Storage erişilemez' })

    // Agent base64 gönderiyorsa decode et
    const buffer = encoding === 'base64'
      ? Buffer.from(content, 'base64')
      : Buffer.from(content, 'utf-8')

    const remotePath = `backups/${key}/${filename}`
    const file = bucket.file(remotePath)
    await file.save(buffer, {
      metadata: {
        metadata: {
          backup_time:     new Date().toISOString(),
          original_path:   filePath || '',
          source_machine:  machine_name || '',
          ai_reason:       ai_reason || '',
          ai_confidence:   ai_confidence || '',
          source_label:    source_label || '',
          file_hash:       file_hash || '',
        }
      }
    })

    console.log(`[UPLOAD] ${filename} (${(buffer.length / 1024).toFixed(1)} KB) -> ${remotePath}`)
    res.json({ ok: true, message: 'Dosya yüklendi' })
  } catch (err) {
    console.error('[UPLOAD ERROR]', err)
    res.status(500).json({ error: err.message })
  }
}

export default router
