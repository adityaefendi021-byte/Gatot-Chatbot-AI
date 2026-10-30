# GATOT AI

Chatbot personal berbasis Gemini API dengan frontend HTML, CSS, Vanilla JavaScript dan backend Node.js + Express. Tampilan memakai nuansa batik Nusantara.

## Persyaratan
- Node.js 18 atau lebih baru
- API key Gemini dari Google AI Studio
- VS Code

## Instalasi
1. Buka folder proyek di VS Code.
2. Buka terminal pada folder yang berisi `package.json`.
3. Jalankan `npm install`.
4. Salin `.env.example`, lalu ubah nama salinannya menjadi `.env`.
5. Isi `GEMINI_API_KEY` pada `.env`. Jangan bagikan file ini.
6. Jalankan `npm start`.
7. Buka `http://localhost:3000`.

## Struktur
- `index.js`: server Express dan endpoint `POST /api/chat`.
- `public/index.html`: halaman chatbot.
- `public/style.css`: desain antarmuka.
- `public/script.js`: interaksi chat dan penyimpanan riwayat di browser.
- `.env`: API key dan konfigurasi lokal (tidak diunggah ke GitHub).

## API
`POST /api/chat`

Request:
```json
{
  "conversation": [
    { "role": "user", "text": "Halo Gatot" }
  ]
}
```

Response:
```json
{
  "result": "Halo! Ada yang bisa saya bantu?"
}
```

Model default: `gemini-3.8-flash`. Model dapat diganti melalui `GEMINI_MODEL` di `.env`.

Catatan: Gemini 3.6 dan model yang lebih baru mengabaikan parameter sampling `temperature`, `top_p`, dan `top_k`. Karena itu konfigurasi contoh ini menggunakan `systemInstruction` dan `maxOutputTokens`, sesuai panduan model terbaru. `generateContent` tetap didukung dan dipakai agar alur proyek tetap dekat dengan materi Sesi 3.
