# Smart Step Learning Assistant — Planning

## Overview

Aplikasi pembelajaran adaptif berbasis AI yang membantu pengguna — terutama mereka dengan gangguan kognitif seperti **ADHD atau autisme** — belajar dengan cara yang lebih terstruktur, mudah dipahami, dan fokus. Aplikasi menyederhanakan materi menjadi micro-steps kecil yang mudah diikuti, dilengkapi quiz otomatis, text-to-speech, dan Pomodoro timer. Berjalan secara lokal di browser.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend + API Routes | Next.js 14 |
| Styling | Tailwind CSS |
| Komponen UI | shadcn/ui |
| AI (simplifikasi + quiz) | Google Gemini API (AI Studio) |
| Ekstraksi PDF | pdf-parse |
| Ekstraksi teks dari gambar | Gemini Vision |
| Text-to-Speech | Web Speech API (native browser) |
| Persistensi data | localStorage |
| Dev server | `npm run dev` (localhost:3000) |

---

## Fitur

### 1. Input Materi
- Input teks langsung via textarea
- Upload file **PDF** → ekstrak teks otomatis via `pdf-parse`
- Upload **gambar** (JPG/PNG) yang mengandung teks → ekstrak via Gemini Vision
- Materi bisa berupa: penjelasan panjang, soal latihan, atau gambar berteks
- Preview teks hasil ekstraksi sebelum diproses
- Tombol "Proses Materi" dengan loading indicator saat AI bekerja

### 2. Pemrosesan & Penyederhanaan AI
- Teks dikirim ke Google Gemini API (AI Studio)
- AI memecah materi menjadi micro-steps (3–5 kalimat per langkah)
- Setiap langkah memiliki judul singkat + penjelasan sederhana
- Deteksi bahasa otomatis (Indonesia/Inggris) — AI merespons dalam bahasa yang sama

### 3. Tampilan Micro-Steps
- Satu kartu per langkah (tidak scroll panjang)
- Navigasi prev/next antar langkah
- Indikator progres: "Langkah 2 dari 7"
- Tombol "Dengarkan" (TTS) di setiap kartu

### 4. Text-to-Speech (TTS)
- Tombol play/stop di setiap kartu langkah
- Menggunakan `window.speechSynthesis` (Web Speech API, gratis & native browser)
- Otomatis menyesuaikan bahasa dengan konten (Indonesia atau Inggris)

### 5. Mini Quiz Otomatis
- Generate 3–5 soal pilihan ganda dari materi yang sudah disederhanakan
- Soal dibuat oleh AI — relevan dengan materi, bukan soal generik
- Shuffle urutan soal & pilihan jawaban tiap sesi
- Timer per soal opsional (bisa diaktifkan/dimatikan)

### 6. Umpan Balik Quiz
- Jawaban benar → animasi/pesan positif, lanjut ke soal berikutnya
- Jawaban salah → pesan "Hampir!" + hint penjelasan (bukan langsung jawaban)
- Retry maksimal 2× per soal, setelah itu jawaban benar diungkap + penjelasan
- Tidak ada kata "Salah" atau "Gagal" di seluruh aplikasi

### 7. Adaptive Difficulty
- Setelah quiz selesai, sistem menghitung skor
- **Skor < 60%** → AI generate ulang soal lebih mudah + tampilkan ulang micro-steps terkait
- **Skor 60–79%** → lanjut normal, tandai topik untuk review
- **Skor ≥ 80%** → lanjut ke materi berikutnya, soal berikutnya lebih menantang

### 8. Pomodoro Timer
- Default: 25 menit belajar / 5 menit istirahat
- Dapat dikustomisasi oleh pengguna
- Notifikasi lembut saat waktu habis (tidak mengagetkan)
- Auto-pause materi & quiz saat masuk waktu istirahat
- State timer disimpan di localStorage agar tidak hilang saat refresh

### 9. Progress & Ringkasan Sesi
- Skor per sesi disimpan di localStorage
- Halaman ringkasan setelah quiz selesai:
  - Total skor
  - Soal mana yang keliru + penjelasannya
  - Rekomendasi: "Ulangi langkah 3 & 5" jika skor rendah
- Riwayat sesi sebelumnya bisa dilihat (tersimpan lokal)

---

## Alur Utama Pengguna

```
Input Materi (teks / PDF / gambar)
    ↓
Ekstraksi Teks (pdf-parse / OpenAI Vision)
    ↓
Proses AI → Micro-Steps
    ↓
Baca Micro-Steps (+ TTS, Pomodoro aktif)
    ↓
Quiz Otomatis (3–5 soal)
    ↓
Umpan Balik + Skor
    ↓
Adaptive: ulang / review / lanjut
    ↓
Ringkasan Sesi → simpan ke localStorage
```
