import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

// Ana admin uygulamasını başlat (Eğer daha önce başlatılmadıysa)
let mainApp;
try {
  const serviceAccount = process.env.FIREBASE_CREDENTIALS 
    ? JSON.parse(process.env.FIREBASE_CREDENTIALS) 
    : JSON.parse(fs.readFileSync(path.resolve(process.env.FIREBASE_KEY_PATH), 'utf8'));

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  mainApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  mainApp = admin.app(); // Zaten başlatılmışsa onu al
}

// BURASI KRİTİK: db'yi buradan export ediyoruz
export const db = admin.firestore(mainApp);

const _buckets = new Map()

export function getBucket(bucketName) {
  if (!bucketName) return null
  if (_buckets.has(bucketName)) return _buckets.get(bucketName)

  try {
    const bucket = admin.storage(mainApp).bucket(
      bucketName.includes('.') ? bucketName : `${bucketName}.firebasestorage.app`
    )
    _buckets.set(bucketName, bucket)
    return bucket
  } catch (err) {
    console.error(`[Storage] Hata [${bucketName}]:`, err.message)
    return null
  }
}
