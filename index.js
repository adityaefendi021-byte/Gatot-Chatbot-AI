import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY belum diisi. Buat file .env dan masukkan API key Gemini.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
Kamu adalah GATOT AI, asisten pribadi serbaguna buatan Indonesia.
Kamu ramah, cerdas, sopan, profesional, dan komunikatif.
Bantu pengguna untuk belajar, bekerja, menulis, membuat ide,
memahami teknologi, pemrograman, produktivitas, dan pertanyaan umum.
Gunakan bahasa yang sama dengan pengguna.
Jelaskan hal rumit dengan bahasa sederhana dan langkah yang runtut.
Gunakan Markdown jika membantu keterbacaan.
Jangan mengarang fakta. Jika tidak yakin, jelaskan keterbatasannya.
Jangan mengaku telah melakukan tindakan di luar kemampuanmu.
`;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', app: 'GATOT AI', model: MODEL });
});

app.post('/api/chat', async (req, res) => {
  try {
    const rawConversation = req.body?.conversation ?? req.body?.messages;

    if (!Array.isArray(rawConversation) || rawConversation.length === 0) {
      return res.status(400).json({
        error: 'Percakapan kosong. Kirim array conversation atau messages.'
      });
    }

    const contents = rawConversation
      .slice(-20)
      .map((item) => {
        const role = item?.role;
        const text = item?.text ?? item?.content;

        if (!['user', 'model', 'assistant'].includes(role)) return null;
        if (typeof text !== 'string' || !text.trim()) return null;

        return {
          role: role === 'assistant' ? 'model' : role,
          parts: [{ text: text.trim() }]
        };
      })
      .filter(Boolean);

    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      return res.status(400).json({
        error: 'Pesan terakhir harus berasal dari pengguna.'
      });
    }

    // Gemini 3.8 Flash mendukung generateContent.
    // Model Gemini 3.6+ mengabaikan temperature, topP, dan topK,
    // jadi parameter sampling lama sengaja tidak dikirim.
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 2048
      }
    });

    const result = response.text?.trim();

    if (!result) {
      return res.status(502).json({
        error: 'Gemini tidak mengembalikan teks. Silakan coba lagi.'
      });
    }

    return res.json({ result });
  } catch (error) {
    console.error('GATOT AI API error:', error);

    const message = error?.message || 'Terjadi kesalahan saat menghubungi Gemini.';
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600
      ? Number(error.status)
      : 500;

    return res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`GATOT AI berjalan di http://localhost:${PORT}`);
  console.log(`Model AI: ${MODEL}`);
});