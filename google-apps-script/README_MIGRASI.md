# 📖 Panduan Migrasi Cakel ke Google Apps Script & Google Sheets

Dokumen ini berisi panduan langkah-demi-langkah untuk menjalankan aplikasi **Cakel (Catatan Kelas, Absensi, & Nilai)** secara 100% gratis menggunakan **Google Sheets sebagai Database** dan **Google Apps Script sebagai Server Web App**.

---

## 📂 Daftar File Project (Telah Dibuat di Folder `/google-apps-script`)
1. **`code.gs`** (Backend script server-side)
2. **`index.html`** (Kerangka HTML utama)
3. **`css.html`** (Styling CSS modern)
4. **`js_gas.html`** (Jembatan Database API ke Google Sheets)
5. **`js_chart.html`** (Pustaka grafik SVG)
6. **`js_absensi.html`** (Logika fitur Absensi)
7. **`js_nilai.html`** (Logika fitur Nilai)
8. **`js_export.html`** (Logika ekspor Excel/CSV & impor batch)
9. **`js_app.html`** (Router & Controller aplikasi utama)

---

## 🛠️ Langkah 1: Persiapan Google Spreadsheet (Database)
1. Buka [Google Sheets](https://sheets.new) baru.
2. Beri nama file Spreadsheet Anda, misalnya: **`Database Cakel`**.
3. Buat **6 sheet (tab)** baru di dalamnya dengan nama persis dan kolom header (di baris pertama) seperti berikut:

   * **Sheet 1**: `classes`
     * Kolom A1: `id`
     * Kolom B1: `name`
   * **Sheet 2**: `students`
     * Kolom A1: `id`
     * Kolom B1: `class_id`
     * Kolom C1: `name`
     * Kolom D1: `nis`
   * **Sheet 3**: `attendance`
     * Kolom A1: `id`
     * Kolom B1: `class_id`
     * Kolom C1: `date`
     * Kolom D1: `time`
     * Kolom E1: `student_id`
     * Kolom F1: `status`
     * Kolom G1: `semester`
   * **Sheet 4**: `grades`
     * Kolom A1: `id`
     * Kolom B1: `class_id`
     * Kolom C1: `date`
     * Kolom D1: `category`
     * Kolom E1: `title`
     * Kolom F1: `student_id`
     * Kolom G1: `score`
     * Kolom H1: `semester`
   * **Sheet 5**: `notes`
     * Kolom A1: `id`
     * Kolom B1: `class_id`
     * Kolom C1: `title`
     * Kolom D1: `tag`
     * Kolom E1: `content`
     * Kolom F1: `date`
   * **Sheet 6**: `app_settings`
     * Kolom A1: `key`
     * Kolom B1: `value`

---

## 💻 Langkah 2: Membuat Project Google Apps Script
1. Di Google Sheets Anda, buka menu **Ekstensi (Extensions)** -> **Apps Script**.
2. Beri nama project Anda, misal: **`Web App Cakel`**.
3. Di dalam editor Apps Script:
   - Ganti isi file **`Code.gs`** bawaan dengan seluruh isi file **`code.gs`** dari folder `/google-apps-script`.
4. Buat file HTML baru satu per satu dengan mengklik tombol **`+` (Add a file)** -> **HTML**:
   - Buat file bernama **`index`** (otomatis menjadi `index.html`), ganti isinya dengan file **`index.html`** dari folder.
   - Buat file bernama **`css`**, ganti isinya dengan file **`css.html`**.
   - Buat file bernama **`js_gas`**, ganti isinya dengan file **`js_gas.html`**.
   - Buat file bernama **`js_chart`**, ganti isinya dengan file **`js_chart.html`**.
   - Buat file bernama **`js_absensi`**, ganti isinya dengan file **`js_absensi.html`**.
   - Buat file bernama **`js_nilai`**, ganti isinya dengan file **`js_nilai.html`**.
   - Buat file bernama **`js_export`**, ganti isinya dengan file **`js_export.html`**.
   - Buat file bernama **`js_app`**, ganti isinya dengan file **`js_app.html`**.

5. Klik tombol **Save Project (Ctrl+S / Cmd+S)**.

---

## 🚀 Langkah 3: Deploy sebagai Web Application
1. Di sudut kanan atas editor Apps Script, klik tombol **Terapkan (Deploy)** -> **Penerapan baru (New deployment)**.
2. Klik ikon gir (pilih jenis penerapan) -> pilih **Aplikasi web (Web app)**.
3. Atur konfigurasi berikut:
   * **Deskripsi**: `Cakel GAS Versi 1.0`
   * **Jalankan sebagai (Execute as)**: `Saya (email-anda@gmail.com)` (Ini penting agar script bisa menulis data ke sheet Anda).
   * **Siapa yang memiliki akses (Who has access)**: `Siapa saja (Anyone)` (Ini agar Anda dapat membuka web di handphone tanpa harus login akun Google terus-menerus).
4. Klik tombol **Terapkan (Deploy)**.
5. Klik **Berikan akses (Authorize Access)** jika diminta:
   - Pilih akun Gmail Anda.
   - Klik **Advanced** (di bagian bawah kiri).
   - Klik **Go to Web App Cakel (unsafe)**.
   - Klik **Allow**.
6. Salin **URL Aplikasi Web** yang diberikan oleh Google (formatnya seperti `https://script.google.com/macros/s/.../exec`).

---

## 📱 Langkah 4: Cara Penggunaan & PWA
- Buka URL Aplikasi Web tersebut di Google Chrome (Android) atau Safari (iOS) Anda.
- Masuk menggunakan default login: username **`admin`** | password **`admin`**.
- Aplikasi siap digunakan! Semua input absensi, nilai, kelas, siswa, dan catatan secara otomatis akan terisi langsung ke dalam Google Sheet Anda secara realtime.
- **Membuat Icon App di HP**: Buka URL di Chrome -> Klik Titik Tiga -> **Tambahkan ke Layar Utama (Add to Home Screen)**. Aplikasi akan terpasang di HP Anda layaknya aplikasi native!
