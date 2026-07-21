# 📱 Cakel - Catatan Kelas (PWA + Supabase + Vercel)

Aplikasi manajemen absensi dan nilai siswa berbasis Web Mobile (PWA) dengan desain antarmuka modern yang disesuaikan secara presisi dengan screenshot tampilan Android.

---

## 🚀 Fitur Utama

- 📊 **Grafik Kehadiran 6 Bulan**: Tren kehadiran otomatis.
- 📋 **Pencatatan Absensi Hari Ini**: Status Hadir (Hijau), Izin (Oranye), Sakit (Biru), Alpa (Merah).
- 📈 **Manajemen Nilai**: Input Ulangan/Tugas/UTS/UAS dengan kalkulasi otomatis Rata-rata, Nilai Tertinggi, Nilai Terendah.
- 💾 **Local-First & Supabase Sync**: Dapat dipakai offline langsung di HP, serta mendukung sinkronisasi cloud dengan Supabase.
- 📊 **Ekspor Excel**: Unduh rekapitulasi data absensi dan nilai dalam format `.xlsx`.
- 📱 **PWA (Install sebagai APK)**: Dikelola langsung dari Vercel tanpa perlu kompilasi Android (Native APK).

---

## 📦 Langkah 1: Push Project ke GitHub

1. Buka terminal di folder projek ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit aplikasi Absensi & Nilai PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/NAMA-REPO-ANDA.git
   git push -u origin main
   ```

---

## ⚡ Langkah 2: Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/new).
2. Pilih repo GitHub yang baru dibuat.
3. Klik **Deploy** (Tanpa konfigurasi tambahan karena project ini murni PWA Web).
4. Setelah selesai, Anda akan mendapatkan URL publik aplikasi, contoh: `https://absensi-nilai.vercel.app`.

---

## 🗄️ Langkah 3: Setup Database Supabase (Opsional & Direkomendasikan)

1. Buka [Supabase Dashboard](https://supabase.com) dan buat Project Baru.
2. Buka menu **SQL Editor** di Supabase.
3. Salin dan tempelkan seluruh isi file `supabase_schema.sql` dari project ini, lalu tekan tombol **Run**.
4. Ambil **Project URL** dan **Anon API Key** dari menu `Project Settings -> API`.
5. Buka aplikasi yang telah ter-deploy di Vercel, masuk ke menu **Pengaturan**, dan masukkan URL serta Anon Key Anda.

---

## 📱 Langkah 4: Cara Memasang di HP Android (Tanpa Compile APK)

1. Buka URL aplikasi Vercel di **Google Chrome** HP Android Anda (misal `https://absensi-nilai.vercel.app`).
2. Tekan tombol **titik tiga (⋮)** di pojok kanan atas browser.
3. Pilih **"Tambahkan ke Layar Utama"** atau **"Install Aplikasi"**.
4. Aplikasi akan langsung terpasang di layar utama Android Anda dengan icon & tampilan **Full Screen Standalone** layaknya file `.apk` asli!
