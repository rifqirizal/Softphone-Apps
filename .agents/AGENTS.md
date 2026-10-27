# AGENTS.md — Development Guidelines & Operational Rules

## 1. Project Overview & Identity
* **Project Name:** Softphone Apps (`com.synergix.webphone`)
* **Type:** Mobile VoIP Softphone (SIP & WebRTC Client)
* **Framework:** React Native CLI (v0.73.6)
* **Core Function:** Klien softphone mobile yang mengintegrasikan autentikasi API dengan SIP Server / PBX (Asterisk/Kamailio) via WebRTC (`sip.js`, `react-native-webrtc`, `react-native-incall-manager`).

---

## 2. Enhancement & Proposal Protocol (Wajib Konfirmasi)
* **Diskusi vs Eksekusi:**
  * Setiap kali ada ide enhancement, refactoring arsitektur besar, atau penambahan fitur baru, **JANGAN langsung eksekusi tanpa konfirmasi**.
  * Berikan ringkasan rencana / opsi arsitektur terlebih dahulu, lalu tanyakan kepada user:
    > *"Apakah ingin didiskusikan terlebih dahulu detailnya, atau langsung dieksekusi?"*
  * Eksekusi langsung hanya diperbolehkan jika user memberikan instruksi eksplisit dan jelas untuk melakukan perubahan tersebut.

---

## 3. Cross-Platform Rules (Wajib iOS & Android)
Setiap function, komponen UI, atau modifikasi logika harus berfungsi optimal di **keduanya**:
* **UI & Styling:**
  * Gunakan TailwindCSS (NativeWind) dan custom token warna di `src/theme/colors.js`.
  * Selalu gunakan `SafeAreaProvider` & `SafeAreaView` dari `react-native-safe-area-context` untuk menangani notch iPhone, Dynamic Island, dan status bar Android.
  * Hindari styling spesifik platform kecuali menggunakan guard `Platform.OS === 'ios'` / `'android'`.
* **Audio & Hardware Permissions:**
  * **Android:** Kelola perizinan `RECORD_AUDIO` dan `BLUETOOTH_CONNECT` (Android 12+) secara runtime melalui `PermissionsAndroid`.
  * **iOS:** Pastikan key `NSMicrophoneUsageDescription` dan deskripsi VoIP terpasang pada `ios/SynergixWebphone/Info.plist`.
* **Audio Routing:**
  * Wajib menguji rute audio (Speakerphone, Earpiece, Bluetooth headset) menggunakan `react-native-incall-manager` di kedua OS.

---

## 4. Library Installation & Security Checks
* **Security & Vulnerability Guard:**
  * Sebelum memasang package baru, verifikasi kebutuhan dan pastikan tidak membawa vulnerabilities berisiko tinggi.
  * Jalankan `npm audit` untuk memastikan dependensi bersih dari celah keamanan kritis.
* **Kompatibilitas Native:**
  * Utamakan library yang mendukung React Native 0.73+ dan arsitektur yang kompatibel.
  * Hindari package usang (*deprecated* / tidak terawat) yang dapat menyebabkan bentrok pada build Gradle Android (AGP 8+) atau CocoaPods iOS.

---

## 5. Health Check & Pre-Build Diagnostics
Sebelum menjalankan proses build atau merilis APK/IPA:
1. **Pemeriksaan Environment & Dependency:**
   * Ingatkan user / jalankan check kesehatan proyek:
     * `npx react-native doctor` (untuk validasi toolchain Android SDK, JDK, Node, Xcode).
     * Jika menggunakan tools expo/checker terkait: periksa kompatibilitas versi dependensi.
2. **Kompilasi Metro & Cache:**
   * Jika ada perubahan pada `.env` atau konfigurasi Babel, jalankan Metro dengan reset cache:
     ```powershell
     npx react-native start --reset-cache
     ```
3. **Android Release ProGuard Verification:**
   * Pastikan `android/app/proguard-rules.pro` mempertahankan class native WebRTC dan InCallManager (`-keep class org.webrtc.** { *; }` dan `-keep class com.zxcpoiu.incallmanager.** { *; }`) agar aplikasi rilis tidak crash.

---

## 6. Environment & Secrets Management
* Semua konfigurasi host, timeout, keepalive, dan STUN/TURN server **HARUS** diambil melalui modul terpusat [src/config/env.js](file:///d:/Project%20JSM/Playground/synergix-apps-softphone/src/config/env.js) yang terhubung ke `.env`.
* **Dilarang keras** meng-hardcode URL server, kredensial PBX, token rahasia, atau alamat IP langsung di file komponen/services.
* Pastikan file `.env` selalu masuk dalam `.gitignore` dan hanya `.env.example` yang dikomit.

---

## 7. VoIP & SIP Lifecycle Management
* **Clean Session Termination:**
  * Setiap panggilan yang berakhir (baik ditolak, gagal, atau di-hangup) wajib memanggil `InCallManager.stop()` dan mereset state audio untuk mencegah baterai boros dan kebocoran memori.
* **Logout & PBX Session Cleanup:**
  * Saat user logout, aplikasi wajib memanggil endpoint logout backend (mengirim extension yang aktif), memutuskan registrasi SIP (`sipService.disconnect(true)`), lalu membersihkan cache lokal (`storage.clearAll()`).
* **Microphone Availability:**
  * Selalu cek izin mikrofon sebelum melakukan panggilan keluar (*outbound*) maupun menerima panggilan masuk (*inbound*).

---

## 8. Struktur Direktori Standar
```text
src/
├── assets/         # Aset gambar, ikon, nada dering
├── components/     # Komponen UI modular (Keypad, EyeIcon, Splash, dll.)
├── config/         # Konfigurasi terpusat (env.js)
├── screens/        # Tampilan utama (LoginScreen, DialerScreen, InCallModal, IncomingCallModal)
├── services/       # Logika backend & SIP (api.js, sipService.js, storage.js)
└── theme/          # Design system & palet warna (colors.js)
```
