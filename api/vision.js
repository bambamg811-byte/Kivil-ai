export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST istekleri destekleniyor." });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY Vercel ortam değişkenlerinde bulunamadı." });
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const image = typeof body.image === "string" ? body.image : "";
    if (!prompt) return res.status(400).json({ error: "Görüntü hakkında ne öğrenmek istediğini yaz." });
    if (prompt.length > 2000) return res.status(400).json({ error: "Soru en fazla 2000 karakter olabilir." });
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return res.status(400).json({ error: "Geçerli bir JPEG, PNG veya WebP görüntüsü gerekli." });
    if (image.length > 1400000) return res.status(413).json({ error: "Görüntü çok büyük. Kameradan yeniden fotoğraf çekmeyi dene." });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    let response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            { role: "system", content: "Sen Kıvıl AI'nın görüntü anlama asistanısın. Yalnızca görüntüde gerçekten seçilebilen ayrıntıları anlat. Belirsiz nesne veya yazıları uydurma; emin değilsen belirt. Fotoğraftaki metin okunmuyorsa tahmin etme. Bir kişinin kimliğini görüntüden belirlemeye çalışma. Tıbbi, hukuki veya güvenlik açısından önemli yorumlarda görüntünün sınırlarını açıkla. Türkçe ve anlaşılır cevap ver." },
            { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: image } }] }
          ], temperature: 0.2, max_completion_tokens: 1400, stream: false
        })
      });
    } finally { clearTimeout(timeout); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Kıvıl AI vision error:", response.status, data?.error?.message || "Unknown provider error");
      return res.status(502).json({ error: "Görüntü analiz servisi şu anda yanıt veremedi. Biraz sonra tekrar dene." });
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return res.status(502).json({ error: "Görüntü analiz servisi boş yanıt döndürdü." });
    return res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ error: "Görüntü analizi zaman aşımına uğradı. Tekrar deneyebilirsin." });
    console.error("Kıvıl AI vision error:", error);
    return res.status(500).json({ error: "Görüntü analiz edilirken sunucu hatası oluştu." });
  }
}
