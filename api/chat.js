
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
        role: m.role,
        content: m.content.slice(0, 8000)
      }));

    if (
      !chatMessages.length ||
      chatMessages[chatMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({ error: "Önce bir mesaj yaz." });
    }

    const systemPrompt = `

GÖRSEL OLUŞTURMA KURALI:
Kullanıcı grafik istediğinde ASCII grafik veya Python kodu verme.
Mutlaka şu formatta geçerli JSON içeren chart kod bloğu üret:

```chart
{
  "title": "Grafik başlığı",
  "type": "line",
  "labels": ["2020", "2021", "2022"],
  "datasets": [
    {"label": "Nüfus (milyon)", "data": [83.4, 84.3, 85.0]}
  ]
}
```

Kullanıcı üçgen veya geometrik şekil istediğinde geometry bloğu üret.
Kullanıcı 3D model istediğinde 3d bloğu üret.
Bu blokların dışında ayrıca ASCII grafik çizme.
Veri kesin değilse tahmin olduğunu belirt, gerçek veri uydurma.


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
            { role: "system", content: systemPrompt },
            ...chatMessages
          ],
          temperature: 0.7,
          max_tokens: 2500
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
      return res.status(502).json({
        error: "Yanıt oluşturulamadı."
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Kıvıl AI error:", error);
    return res.status(500).json({
      error: "Sunucuda bir hata oluştu."
    });
  }
}
