import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

const _buckets = new Map()

export function getBucket(bucketName) {
  if (!bucketName) return null
  if (_buckets.has(bucketName)) return _buckets.get(bucketName)

  try {
    let serviceAccount;

    if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else if (process.env.FIREBASE_KEY_PATH) {
      const keyPath = path.resolve(process.env.FIREBASE_KEY_PATH);
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
      throw new Error('FIREBASE_CREDENTIALS veya FIREBASE_KEY_PATH env var eksik');
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const cred = admin.credential.cert(serviceAccount)
    const appName = `bucket_${bucketName.replace(/[^a-z0-9]/gi, '_')}`

    let app
    try {
      app = admin.app(appName)
    } catch {
      app = admin.initializeApp({
        credential: cred,
        storageBucket: bucketName.includes('.') ? bucketName : `${bucketName}.firebasestorage.app`
      }, appName)
    }

    const bucket = admin.storage(app).bucket()
    _buckets.set(bucketName, bucket)
    return bucket
  } catch (err) {
    console.error(`[Storage] Hata [${bucketName}]:`, err.message)
    return null
  }
}