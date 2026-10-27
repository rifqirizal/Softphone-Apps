# Softphone Apps (VoIP & WebRTC)

Aplikasi klien softphone VoIP mobile berbasis **React Native CLI (v0.73.6)**. Aplikasi ini dapat beroperasi di jaringan publik maupun **jaringan lokal (Intranet, LAN, atau Private VPN)** untuk melakukan panggilan suara dua arah berkualitas tinggi menggunakan teknologi **SIP** dan **WebRTC**.

Proyek ini dikembangkan menggunakan standar **Agentic AI Guidelines** yang terdokumentasi pada [`.agents/AGENTS.md`](.agents/AGENTS.md).

---

## 🚀 Fitur Utama

* **Zero-Config PBX Setup**: Pengguna tidak perlu mengisi parameter teknis PBX (SIP Server, WSS, extension port) secara manual. Aplikasi secara otomatis mengambil ekstensi PBX dari profil backend akun pengguna.
* **Support Jaringan Lokal & Privat**: Dapat beroperasi di jaringan lokal kantor, LAN/WLAN lokal, VPN kantor, maupun koneksi internet publik.
* **WebRTC & Audio Management**: Menggunakan `react-native-webrtc` dan `react-native-incall-manager` untuk manajemen rute audio (Speakerphone, Earpiece, dan Bluetooth Headset).
* **Fitur Panggilan Lengkap**:
  * Panggilan keluar (*Outbound Call*) & panggilan masuk (*Inbound Call*).
  * DTMF Keypad (*Touch-Tone/IVR navigation*).
  * Kontrol panggilan: *Mute*, *Hold*, dan *Speaker toggle*.
  * Indikator status registrasi real-time (*Ready*, *Connecting*, *Error*).
* **Cross-Platform Ready**: Dirancang dan diuji untuk berjalan optimal di **Android** dan **iOS**.

---

## 🛠️ Tech Stack

* **Core Framework**: React Native `0.73.6` (React `18.2.0`)
* **SIP Client**: `sip.js` (`^0.20.0`)
* **Media WebRTC**: `react-native-webrtc` (`^155.0.1`)
* **Audio Routing**: `react-native-incall-manager` (`^4.3.0`)
* **Styling**: NativeWind `^4.2.7` & TailwindCSS
* **Environment**: `react-native-dotenv` via Babel
* **Storage**: `@react-native-async-storage/async-storage` (`1.23.1`)

---

## 📋 Prasyarat Lingkungan (Prerequisites)

* **Node.js**: v18.x atau v20.x LTS
* **Java SDK**: **JDK 17** (wajib untuk AGP 8+)
* **Android Studio**: Android SDK Build-Tools 34.0.0, Android NDK `25.1.8937393`
* **Xcode & CocoaPods** *(khusus macOS untuk build iOS)*: Xcode 15+, CocoaPods 1.14+

---

## ⚙️ Konfigurasi Environment (`.env`)

1. Salin template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Hubungi **Administrator Sistem / Jaringan** untuk mendapatkan konfigurasi yang sesuai dengan lingkungan server Anda, lalu sesuaikan nilai variabel di dalam file `.env` (merujuk pada template `.env.example`).

> Nilai `.env` akan di-inline secara otomatis ke dalam bundle JavaScript aplikasi saat proses build.

---

## 🏃 Panduan Menjalankan Aplikasi (Development / Running)

### 1. Install Dependensi
```bash
npm install
```

### 2. Jalankan Metro Bundler
Selalu gunakan flag `--reset-cache` jika Anda baru saja mengubah file `.env`:
```bash
npx react-native start --reset-cache
```

### 3. Menjalankan di Android
Pastikan emulator Android sudah aktif atau perangkat fisik terhubung via USB (USB Debugging ON):
```bash
# Menjalankan di perangkat default / emulator aktif
npm run android

# Atau targetkan emulator tertentu
npx react-native run-android --deviceId emulator-5554
```

### 4. Menjalankan di iOS *(macOS only)*
```bash
# Install CocoaPods dependencies terlebih dahulu
cd ios && pod install && cd ..

# Jalankan di iOS Simulator
npm run ios
```

---

## 📦 Panduan Build Aplikasi (Production / Staging)

### 🤖 Build Android (APK)

Masuk ke folder `android`:
```powershell
cd android
```

1. **Bersihkan Cache Gradle:**
   ```powershell
   ./gradlew clean
   ```

2. **Build Debug APK (Untuk Pengujian Cepat di Device):**
   ```powershell
   ./gradlew assembleDebug
   ```
   *Output APK:*  
   `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Build Release APK (Optimasi ProGuard untuk WebRTC & InCallManager):**
   ```powershell
   ./gradlew assembleRelease
   ```
   *Output APK:*  
   `android/app/build/outputs/apk/release/app-release.apk`

4. **Build Android App Bundle (AAB untuk Google Play Store):**
   ```powershell
   ./gradlew bundleRelease
   ```
   *Output AAB:*  
   `android/app/build/outputs/bundle/release/app-release.aab`

---

### 🍏 Build iOS (IPA / Archive) *(macOS only)*

1. **Bersihkan build cache dan install Pods:**
   ```bash
   cd ios
   rm -rf build Pods Podfile.lock
   pod install
   cd ..
   ```

2. **Build Release Archive via CLI:**
   ```bash
   npm run build:ios:archive
   ```
   *Atau buka `ios/SynergixWebphone.xcworkspace` di Xcode, lalu pilih menu **Product > Archive**.*

---

## 🤖 Standar Pengembangan Agentic AI (`.agents/AGENTS.md`)

Repository ini menerapkan pedoman operasional AI Agent yang terdokumentasi di [`.agents/AGENTS.md`](.agents/AGENTS.md):

1. **Enhancement Protocol**:
   * Setiap ide penambahan fitur atau refactoring arsitektur **wajib dikonfirmasi** terlebih dahulu kepada developer (*"Apakah ingin didiskusikan terlebih dahulu detailnya, atau langsung dieksekusi?"*).
2. **Strict Cross-Platform**:
   * Setiap fungsi, alur VoIP, atau styling wajib kompatibel dan diuji untuk **Android & iOS**.
3. **Security & Dependency Check**:
   * Menjaga keamanan paket via `npm audit` dan memverifikasi kompatibilitas dengan React Native 0.73+ dan AGP 8.
4. **Pre-Build Health Check**:
   * Menjalankan validasi lingkungan (`npx react-native doctor`) sebelum proses rilis.
5. **VoIP & Audio Session Cleanup**:
   * Wajib memanggil `InCallManager.stop()` dan memutuskan sesi SIP saat panggilan berakhir atau logout guna mencegah *ghost call* dan baterai boros.
