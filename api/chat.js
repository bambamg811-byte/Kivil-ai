export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST isteği gerekli." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY Vercel ayarlarında bulunamadı."
    });
  }

  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const chatMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content.slice(0, 8000)
      }));

    if (
      !chatMessages.length ||
      chatMessages[chatMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({ error: "Önce bir mesaj yaz." });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "Sen Kıvıl AI adlı, Türkçe konuşan, samimi ve faydalı bir yapay zekâ asistanısın. Açık, doğru ve doğal cevaplar ver. Emin olmadığında bunu belirt."
            },
            ...chatMessages
          ],
          temperature: 0.7,
          max_tokens: 1200
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", response.status, data?.error?.message);
      return res.status(502).json({
        error: `Groq API (${response.status}): ${
          data?.error?.message || "Bilinmeyen API hatası"
        }`
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "Yanıt oluşturulamadı." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Kıvıl AI error:", error);
    return res.status(500).json({ error: "Sunucuda bir hata oluştu." });
  }
}
