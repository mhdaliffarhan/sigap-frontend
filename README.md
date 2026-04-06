# SIGAP Frontend (React 19 + Vite)

Frontend aplikasi SIGAP (Sistem Informasi dan Layanan), dibangun menggunakan teknologi modern React 19, Vite, dan Tailwind CSS 4.

## 🚀 Persyaratan Sistem

- **Node.js**: ^18.0 (Direkomendasikan versi LTS terbaru)
- **npm**: ^9.0 (atau Yarn / pnpm)

## 🛠️ Instalasi Awal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan pengembangan:

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd sigap-frontend
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buka file `.env` (atau salin dari `.env.example`) dan sesuaikan URL API Backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara default di `http://localhost:5173`.

## ✨ Fitur Utama

- **Dashboard Interaktif**: Statistik tiket dan aktivitas dalam bentuk chart (menggunakan Recharts).
- **Manajemen Aset BMN**: Pencatatan dan pengelolaan aset negara secara digital.
- **Dynamic Form Engine**: Sistem form yang fleksibel untuk berbagai jenis layanan layanan.
- **Sistem Tiket & Workflow**: Alur pengajuan tiket dari Pegawai hingga penyelesaian oleh Teknisi/PJ.
- **Manajemen Profil**: Pengaturan akun, ganti password, dan upload avatar.
- **Manajemen User (Admin)**: Kontrol akses role-based untuk seluruh pengguna.
- **Pesan & Notifikasi**: Integrasi Sonner untuk toast notification yang interaktif.
- **Dark Mode & Themes**: Dukungan tema gelap/terang melalui `next-themes`.

## 📂 Struktur direktori & Arsitektur

Aplikasi ini menggunakan struktur folder yang terorganisir untuk skalabilitas:

- `src/components/`: Komponen UI yang dapat digunakan kembali (Atoms, Molecules, Organisms).
- `src/components/ui/`: Komponen dasar berbasis Radix UI (shadcn-like).
- `src/pages/`: Halaman atau tampilan utama aplikasi.
- `src/routing/`: Hub pusat untuk konfigurasi route, guard (Public/Protected), dan konstanta path.
- `src/lib/`: Fungsi utilitas, konfigurasi axios, dan logika storage.
- `src/hooks/`: Custom hooks untuk state management dan integrasi API.
- `src/types/`: Definisi interface TypeScript untuk data model.
- `src/assets/`: File statis seperti gambar, logo, dan icon.

## 🚦 Routing & Keamanan

Sistem routing menggunakan `react-router-dom` dengan pola **Guard Pattern**:
- **ProtectedRoute**: Memastikan halaman hanya dapat diakses oleh user yang sudah login.
- **PublicRoute**: Mencegah user yang sudah login untuk kembali ke halaman login.
- **Constants Pattern**: Semua path didefinisikan secara terpusat di `src/routing/constants.ts` untuk menghindari hardcoding.

## 📦 Build untuk Produksi

Untuk melakukan build aplikasi untuk hosting:
```bash
npm run build
```
Hasil build akan berada di dalam folder `dist/`.

## 📄 Lisensi
[MIT license](https://opensource.org/licenses/MIT).
