import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

let _app = null

export function getApp() {
  // Eğer daha önce başlatıldıysa (veya başka bir modül başlattıysa) olanı kullan
  if (_app) return _app;
  if (admin.apps.length > 0) {
    _app = admin.apps[0];
    return _app;
  }

  let serviceAccount;

  try {
    if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else if (process.env.FIREBASE_KEY_PATH) {
      const keyPath = path.resolve(process.env.FIREBASE_KEY_PATH);
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
      throw new Error('FIREBASE_CREDENTIALS veya FIREBASE_KEY_PATH env var eksik');
    }

    // Private key'deki kaçış karakterlerini güvenlice düzelt
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    _app = admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount) 
    });
    console.log('[Firebase] Firestore Veritabanı Başlatıldı');
  } catch (error) {
     console.error("[Firebase Başlatma Hatası]", error.message);
     throw error;
  }

  return _app
}

export function getFirestore() {
  return admin.firestore(getApp())
}
