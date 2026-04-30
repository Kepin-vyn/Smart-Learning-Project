# Smart Step Learning Assistant — Guidelines

Dokumen ini berisi aturan dan constraint yang WAJIB diikuti selama development.
Jangan membuat keputusan yang bertentangan dengan guideline ini tanpa diskusi eksplisit.

> **Target Pengguna:** Aplikasi ini dirancang untuk pengguna dengan gangguan kognitif (ADHD, autisme, atau kesulitan belajar). Setiap keputusan UX, bahasa, dan desain harus mempertimbangkan kebutuhan aksesibilitas mereka.

---

## Konten & Pedagogis

| Aturan | Detail |
|---|---|
| Micro-step limit | Maksimal **3–5 kalimat** per langkah, tidak lebih |
| Jumlah soal quiz | Minimum **3 soal**, maksimum **5 soal** per sesi |
| Quiz timing | Wajib ada quiz **setelah semua micro-steps selesai** dibaca |
| Retry limit | Maksimal **2× retry** per soal sebelum jawaban diungkap |
| Session max | Maksimal **25 menit** belajar aktif sebelum Pomodoro meminta istirahat |
| Adaptive floor | Tingkat soal tidak boleh di bawah level 1 — **selalu ada soal** meski termudah |

---

## UX & Bahasa

| Aturan | Detail |
|---|---|
| Satu konten per layar | Hanya **1 micro-step** atau **1 soal** yang tampil per layar |
| Warna feedback | **Dilarang** pakai merah terang untuk kesalahan — gunakan oranye atau kuning |
| Bahasa feedback | **Dilarang** pakai kata "Salah", "Gagal", "Error" — ganti dengan "Hampir!", "Coba lagi" |
| Loading indicator | Setiap proses AI **wajib** tampilkan animasi loading |
| Animasi | Minimal, tidak berlebihan — hormati pengguna dengan sensitivitas visual |
| Warna UI | Tenang, tidak stimulatif — **hindari** warna neon atau terlalu kontras |

---

## AI Generation

| Aturan | Detail |
|---|---|
| Model | Gunakan **Gemini** (via Google AI Studio) untuk semua proses AI (simplifikasi, quiz, ekstraksi gambar) |
| Konteks soal | Soal quiz **wajib** berdasarkan materi yang diinput — AI tidak boleh membuat soal dari luar konteks |
| Makna materi | Penyederhanaan **tidak boleh** mengubah makna inti materi |
| Bahasa konsisten | AI **wajib** merespons dalam bahasa yang sama dengan materi input |
| Gagal ekstrak PDF | Jika `pdf-parse` gagal ekstrak teks, tampilkan pesan jelas & minta user input manual |
| Gagal ekstrak gambar | Jika Gemini Vision tidak dapat membaca teks dari gambar, tampilkan pesan jelas & minta user input manual |
| Input gambar | Hanya kirim gambar ke Gemini Vision — jangan simpan gambar ke server atau localStorage |

---

## Data & Privasi

| Aturan | Detail |
|---|---|
| Penyimpanan | Semua data (skor, progress, timer) **hanya di localStorage** — tidak dikirim ke server |
| Materi user | Teks & gambar materi hanya dikirim ke Gemini API untuk diproses, **tidak disimpan** di mana pun |
| Tidak ada tracking | **Tidak ada** analytics, tidak ada cookie pihak ketiga |

---

## Teknis

| Aturan | Detail |
|---|---|
| Runtime | Hanya berjalan di **localhost:3000** via `npm run dev` |
| API Key | `GEMINI_API_KEY` disimpan di `.env.local`, **tidak boleh** di-commit ke Git |
| PDF support | Hanya PDF berbasis teks — PDF hasil scan gambar gunakan jalur **upload gambar** |
| Image support | Format yang diterima: JPG, PNG — ukuran maks disarankan < 5MB |
| Browser TTS | Web Speech API — **wajib** cek kompatibilitas browser (Chrome/Edge paling stabil) |

---

## Checklist Sebelum Implementasi Fitur Baru

- [ ] Apakah ada kata "Salah", "Gagal", atau "Error" di UI yang ditampilkan ke user?
- [ ] Apakah setiap proses AI sudah punya loading indicator?
- [ ] Apakah data user disimpan ke server atau third-party? (harus tidak)
- [ ] Apakah warna feedback menggunakan merah terang? (harus tidak)
- [ ] Apakah soal quiz berdasarkan materi yang diinput user? (harus ya)
- [ ] Apakah API key tersimpan di `.env.local` dan di-gitignore?
