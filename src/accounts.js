import { getFirestore } from './db.js'

const col = () => getFirestore().collection('accounts')

export async function keyExists(key) {
  const doc = await col().doc(key).get()
  return doc.exists
}

export async function loadConfig(key) {
  const doc = await col().doc(key).collection('data').doc('config').get()
  if (!doc.exists) throw new Error('Config bulunamadı')
  return doc.data()
}

export async function saveConfig(key, cfg) {
  await col().doc(key).collection('data').doc('config').set(cfg)
}

export async function loadAgents(key) {
  const doc = await col().doc(key).collection('data').doc('agents').get()
  return doc.exists ? doc.data() : {}
}

export async function saveAgents(key, data) {
  await col().doc(key).collection('data').doc('agents').set(data)
}

export async function loadSelfDestruct(key) {
  const doc = await col().doc(key).collection('data').doc('self_destruct').get()
  return doc.exists ? doc.data() : {}
}

export async function saveSelfDestruct(key, data) {
  await col().doc(key).collection('data').doc('self_destruct').set(data)
}

export async function appendLog(key, text) {
  await col().doc(key).collection('logs').add({ text, ts: Date.now() })
  if (Math.random() < 0.02) pruneOldLogs(key).catch(() => {})
}

export async function getLogs(key, limit = 200) {
  const snap = await col().doc(key).collection('logs')
    .orderBy('ts', 'desc').limit(limit).get()
  return snap.docs.map(d => d.data().text)
}

async function pruneOldLogs(key) {
  const snap = await col().doc(key).collection('logs')
    .orderBy('ts', 'desc').offset(500).get()
  if (snap.empty) return
  const batch = getFirestore().batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export async function createAccount(key, config) {
  await col().doc(key).set({ created_at: new Date().toISOString(), key })
  await saveConfig(key, config)
  await saveAgents(key, {})
  console.log(`[Firestore] Yeni key: ${key}`)
}

export async function listKeys() {
  const snap = await col().get()
  return snap.docs.map(d => d.id)
}
