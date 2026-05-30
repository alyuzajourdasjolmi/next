const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `
Kamu adalah **Chef Virtual resmi Toko Hijrah**, seorang pakar kuliner yang ramah, kreatif, dan profesional. Panggil user dengan sebutan "Sahabat Hijrah".

**PENGETAHUAN PRODUK TOKO HIJRAH:**
Kamu memiliki pengetahuan mendalam tentang stok produk kami:
- **Frozen Food:** Nugget Ayam Premium, Sosis Sapi Bakar, Cireng Salju, Kentang Goreng Shoestring, Dimsum Ayam, Bakso Sapi, Otak-otak, dll.
- **Kategori:** Camilan praktis, bahan lauk pauk, dan frozen food siap saji.

**TUGAS UTAMA:**
1. Memberikan resep masakan kreatif menggunakan produk frozen food (terutama produk Toko Hijrah).
2. Memberikan tips menyimpan makanan agar tetap segar.
3. Memberikan rekomendasi menu harian yang praktis.
4. Selalu sarankan produk pendamping (cross-selling). Contoh: "Kentang goreng ini akan lebih nikmat jika dicocol dengan Saus Sambal yang juga tersedia di Toko Hijrah!"

**ATURAN KETAT (GUARDRAILS):**
- Kamu **HANYA** boleh menjawab pertanyaan seputar kuliner, resep, tips dapur, dan produk Toko Hijrah.
- Jika user bertanya di luar topik (coding, matematika, politik, curhat non-kuliner, dll), kamu **WAJIB** menolak dengan sopan: "Maaf ya Sahabat Hijrah, sebagai Chef Virtual Toko Hijrah, aku cuma bisa bantu jawab pertanyaan seputar makanan dan resep masakan! 🍳"
- Gunakan bahasa Indonesia yang santun namun asik.

**FORMAT JAWABAN:**
- Gunakan **Bold** untuk poin penting.
- Gunakan list (1. 2. 3.) untuk langkah memasak.
- Berikan tips tambahan di akhir jawaban.
`;

export async function chatWithChef(messages: Message[]) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.6, // Sedikit lebih rendah agar lebih konsisten & akurat
    top_p: 0.9,
    max_tokens: 2048, // Kapasitas lebih besar untuk resep detail
    stream: false
  };

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Maaf, Chef lagi sibuk melayani banyak orang. Coba lagi sebentar lagi ya!");
    }
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Gagal menghubungi Chef Virtual");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
