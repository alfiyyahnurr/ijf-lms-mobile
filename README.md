# IJF LMS Mobile — Kreativa Global High School Student Portal

Aplikasi mobile frontend **IJF Learning Management System (LMS) — Student Portal** untuk **Kreativa Global High School**, dibangun menggunakan **React Native**, **Expo**, dan **TypeScript**.

Repository ini memuat hasil slicing/layouting antarmuka pengguna (UI/FE) versi mobile yang responsif, modern, dan selaras dengan *Kreativa Design System* serta spesifikasi API backend.

---

## 📱 Ruang Lingkup & Fitur Utama

1. **Google Single Sign-On (SSO)**:
   - Autentikasi khusus akun siswa (`role: student`) sesuai spesifikasi `GOOGLE_SSO.md`.
   - Tanpa form manual email/password, langsung menggunakan tombol resmi Google SSO.
2. **Dashboard**:
   - Header profil siswa, kartu status ringkas (*Active Courses*, *Pending Assignments*, *Upcoming Exams*), jadwal pelajaran hari ini, buletin pengumuman terbaru, dan carousel kursus aktif.
3. **Weekly Plan & Sessions**:
   - Navigasi 5 hari sekolah dinamis (Senin – Jumat) dengan pembatas semester (*Term 1*).
   - Kartu sesi per mapel, status *Pre-learning* & *Post-learning*, serta modal interaktif untuk mencatat refleksi dan pertanyaan pra-pembelajaran.
4. **My Courses & Course Detail**:
   - Daftar 14 mata pelajaran Cambridge IGCSE & Kurikulum Merdeka.
   - Detail silabus kursus, info pengajar, materi unduhan, dan accordion sesi pertemuan W1 s/d W10.
5. **Session Detail**:
   - Tampilan materi pembelajaran kelas, modul sebelum kelas (*reading*), dan refleksi pasca-kelas (*reflection writing*).
6. **Assignments & Submission**:
   - Filter tab tugas: *All*, *Pending*, *Submitted*, dan *Graded*.
   - Lembar detail instruksi tugas, rubrik penilaian, dropzone unggah berkas (multipart/form-data), dan catatan pengumpulan.
7. **Quizzes**:
   - Tampilan kartu bersih (*pure card layout*) dengan informasi durasi, jumlah pertanyaan, dan badge status kuis.
8. **Exams**:
   - Jadwal ujian tengah semester (*Mid-Term Exam*), informasi gedung/ruang ujian (*Hall B*), nomor kursi (*Seat B-14*), dan durasi pengerjaan.
9. **Daily Habit Checklist**:
   - Segmentasi 3 tab: *Daily*, *Recap*, dan *Leaderboard*.
   - Kalender dinamis dengan indikator *submission dots*.
   - Checklist 7 kategori kebiasaan baik dengan auto-save instan dan notifikasi floating toast (+2 pts saat menyelesaikan Full Day).
   - Konsistensi data tanggal mutlak (data historis Oktober 13, 14, 15 terkunci di tanggal aslinya, bulan berjalan bersih).
10. **Leaderboard & My Points History**:
    - Peringkat 3 besar dengan visual podium medali emas, perak, dan perunggu.
    - Peringkat Asrama (*7 Houses: Alexandria, Cordova, Damascus, Granada, Istanbul, Medina, Seville*), Kelas (*S4 Oxford*), dan Jenjang (*IGCSE*).
    - Kartu riwayat perolehan poin (*My points history*) dalam kontainer krem dengan nominal poin hijau (+X).
11. **Literacy (Reading Log)**:
    - Target bacaan semester dan persentase bacaan berbahasa Inggris.
    - Form log bacaan baru dengan klaim argumen (*claim*), bukti kutipan (*evidence*), implikasi gagasan (*so what*), dan rating bintang.
12. **Report Card (Rapor Akademik)**:
    - Rekap nilai per mata pelajaran, predikat (A*/A), dan persentase kehadiran (94–100%).
    - Tombol unduh rapor term dalam format PDF (`GET /api/student/report-cards/:id/pdf`).
13. **Announcements (Buletin Sekolah)**:
    - Informasi pengumuman kegiatan sekolah, filter status baru, dan modal notifikasi universal di topbar seluruh halaman.
14. **Profile & Custom Navigation**:
    - Custom Drawer Menu (74% responsive overlay) dengan identitas siswa dan konfirmasi logout.
    - Custom Bottom Tab Bar yang lebih tinggi (66px + safe insets), icon 24px, dan label 12px.

---

## 🛠️ Teknologi & Stack

- **Framework**: React Native (Expo SDK 54 / React 19)
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Bottom Tabs, Drawer, Native Stack)
- **Design Tokens & Icons**: Custom WebIcons (SVG vector path) & Expo Vector Icons (Ionicons)
- **Typography**: Cabin Font Family (Regular, Medium, SemiBold, Bold) & Consolas
- **Responsive Layout**: React Native Flexbox & `react-native-safe-area-context`

---

## 🚀 Menjalankan Project Secara Lokal

1. **Clone repository**:
   ```bash
   git clone <URL_REPOSITORY>
   cd <nama-repo>
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npx expo start
   ```

4. **Buka di perangkat**:
   - Tekan `w` di terminal untuk membuka di browser Web.
   - Pindai QR Code menggunakan aplikasi **Expo Go** di Android / iOS.

---

## 📂 Dokumentasi API & Backend

Seluruh struktur state dan service layer (`src/services/api.ts`) telah selaras 100% dengan endpoint API resmi:
- **Postman Collection**: [`docs/Kreativa-LMS-Student.postman_collection.json`](docs/Kreativa-LMS-Student.postman_collection.json)
- **Postman Environment**: [`docs/Kreativa-LMS-Student.postman_environment.json`](docs/Kreativa-LMS-Student.postman_environment.json)
- **Google SSO Specification**: [`docs/GOOGLE_SSO.md`](docs/GOOGLE_SSO.md)

---

## 📄 Lisensi & Hak Cipta

© 2026 Kreativa Global High School — IJF Learning Management System. All rights reserved.
