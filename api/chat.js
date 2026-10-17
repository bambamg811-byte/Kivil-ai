export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST isteği gerekli." });
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Google AI anahtarı Vercel ayarlarında bulunamadı."
    });
  }

  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const contents = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, 8000) }]
      }));

    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "Önce bir mesaj yaz." });
    }

    const response = await fetch(
      ""https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Sen Kıvıl AI adlı, Türkçe konuşan, samimi ve faydalı bir yapay zekâ asistanısın. Açık, doğru ve doğal cevaplar ver. Emin olmadığında bunu belirt."
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Google AI API error:", data?.error?.message);
      return res.status(502).json({
        error: "Google AI cevap veremedi. API anahtarını ve kullanım durumunu kontrol et."
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({ error: "Yanıt oluşturulamadı." });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Kıvıl AI error:", error);
    return res.status(500).json({ error: "Sunucuda bir hata oluştu." });
  }
}
