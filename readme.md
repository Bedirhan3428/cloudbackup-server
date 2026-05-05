
<div align="center">
  <h1>⚙️ CloudBackup API Server</h1>
  <p><strong>Eğitim Amaçlı Bulut Yedekleme Sunucusu</strong></p>
</div>

---

> ⚠️ **Önemli Not:** Bu proje tamamen **eğitim ve öğrenme amaçlı** geliştirilmiştir. Ticari bir amaç gütmemektedir ve modern web teknolojilerinin (Node.js, Express, Firebase) birlikte nasıl çalıştığını anlamak için bir örnek teşkil eder.

## 📌 Proje Hakkında

Bu sunucu, bir yedekleme sisteminin (CloudBackup) merkezi yönetim birimidir. Yerel cihazlardan (Agent) gelen dosyaları alır, Firebase Storage üzerinde saklar ve bu süreçleri Firestore veritabanı üzerinden yönetir.

### Temel Özellikler
- **Çoklu Kullanıcı Desteği:** Benzersiz anahtarlar (`CB-XXX`) ile izole edilmiş yedekleme alanları.
- **Firebase Entegrasyonu:** Dosya depolama için Storage, yapılandırma ve log yönetimi için Firestore kullanımı.
- **Yapay Zeka Filtreleme Desteği:** Yedeklenen dosyaların meta verilerinde AI tabanlı sınıflandırma ve analiz bilgileri tutulabilmektedir.
- **Merkezi Log Sistemi:** Agent'lardan gelen işlem kayıtlarının (hata, başarı, AI kararları) gerçek zamanlı takibi.
- **Gelişmiş Dosya Yönetimi:** Dosya boyutu, uzantı kısıtlamaları ve orijinal yol takibi gibi özellikler.

---

## 🚀 Teknolojik Yığın

- **Backend:** `Node.js` (v18+)
- **Framework:** `Express`
- **Veritabanı & Depolama:** `Google Firebase` (Firestore & Storage)
- **Çevre Yönetimi:** `Dotenv`
- **Deployment:** `Render` (YAML konfigürasyonu mevcuttur)

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js (>= 18.0.0)
- Firebase Projesi ve Hizmet Hesabı Anahtarı (JSON)

### 2. Bağımlılıkların Yüklenmesi
```bash
npm install
```

### 3. Çevre Değişkenleri (.env)
Kök dizinde bir `.env` dosyası oluşturun ve aşağıdaki bilgileri projenize göre doldurun:

```env
PORT=10000
FIREBASE_CREDENTIALS={"type": "service_account", ...} # Veya FIREBASE_KEY_PATH
ALLOWED_ORIGINS=http://localhost:3000,https://sizin-fronted-adresiniz.com
```

### 4. Çalıştırma

**Geliştirme Modu:**
```bash
npm run dev
```

**Üretim Modu:**
```bash
npm start
```

---

## 🛣️ API Uç Noktaları (Endpoints)

### Kimlik Doğrulama ve Yönetim
- `POST /api/auth/` : Anahtar doğrulaması yapar.
- `POST /api/auth/keys/create` : Yeni bir yedekleme anahtarı ve varsayılan yapılandırma oluşturur.
- `GET /api/auth/keys/list` : Kayıtlı tüm anahtarları listeler.

### Dosya İşlemleri
- `GET /api/:key/files` : Belirtilen anahtara ait dosyaları listeler.
- `POST /api/files/upload` : Agent'tan gelen dosyayı Firebase'e yükler.
- `GET /api/:key/files/download` : Dosya indirme linki oluşturur.

### Agent ve Durum Takibi
- `POST /api/:key/agents/ping` : Agent'ın çevrimiçi olduğunu bildirir ve güncel ayarları alır.
- `GET /api/:key/stats` : Depolama istatistiklerini (toplam boyut, dosya sayısı, uzantı dağılımı) döner.

---

## 📁 Dosya Yapısı

```text
/src
├── /routes          # API rota tanımlamaları
├── accounts.js      # Veritabanı hesap işlemleri mantığı
├── firebase.js      # Firebase bağlantı yapılandırması
└── helpers.js       # Yardımcı fonksiyonlar (boyut formatlama, emoji atama vb.)
```

> *Bu proje, modern bir yedekleme servisinin arka plan mimarisini anlamak üzere tasarlanmış bir eğitim çalışmasıdır.*

---
**Geliştirici:** Bedirhan İmer
