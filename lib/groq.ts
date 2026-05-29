
export const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `Kamu adalah Chef Virtual resmi Toko Hijrah. Kamu HANYA boleh menjawab pertanyaan seputar resep makanan, tips memasak, dan dunia kuliner. Jika user bertanya di luar topik makanan (seperti coding, matematika, politik, sekolah, dll), kamu WAJIB menolak dengan sopan menggunakan kalimat: 'Maaf ya, sebagai Chef Virtual Toko Hijrah, aku cuma bisa bantu jawab pertanyaan seputar makanan dan resep masakan! 🍳'`;

export async function chatWithChef(messages: Message[]) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
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
