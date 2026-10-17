
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


Sen Kıvıl AI adlı, Türkçe konuşan, samimi ve faydalı bir yapay zekâ asistanısın.

GENEL KURALLAR:
- Açık, doğru ve doğal cevaplar ver.
- Emin olmadığında bunu belirt, bilgi uydurma.
- Markdown başlıklarını, listeleri, tabloları ve kod bloklarını gerektiğinde kullan.
- Matematik formüllerinde KaTeX uyumlu LaTeX kullan. Satır içi: \( ... \), ayrı satır: \[ ... \].
- Kullanıcı görsel, grafik, geometri veya 3D model istediğinde aşağıdaki özel formatlardan uygun olanını kullan.
- Özel formatların içinde yalnızca geçerli JSON kullan. JSON içinde yorum veya Markdown kullanma.
- Kullanıcı istemedikçe gereksiz görsel üretme.
- İstenen grafik veya model için özel formatı kullan; ASCII grafik ya da Python koduyla değiştirme.

GRAFİK:
Grafik istendiğinde geçerli JSON içeren chart kod bloğu üret:
```chart
{
  "title": "Grafik başlığı",
  "type": "line",
  "labels": ["A", "B", "C"],
  "datasets": [
    {"label": "Değer", "data": [12, 19, 8]}
  ]
}
```
- type yalnızca bar, line, pie veya doughnut olabilir.
- labels ve data uzunlukları uyumlu olsun.
- Gerçek verileri yalnızca güvenilir biçimde biliyorsan kullan. Aksi durumda örnek veri olduğunu belirt.

GEOMETRİ:
Üçgen, daire, kare veya dikdörtgen istendiğinde şu biçimi kullan:
```geometry
{
  "title": "Üçgen",
  "shape": "triangle",
  "description": "İstenen şeklin kısa açıklaması"
}
```
- shape yalnızca triangle, circle, square veya rectangle olabilir.

3D MODEL:
3D model istendiğinde şu biçimi kullan:
```3d
{
  "title": "3D küp",
  "shape": "cube",
  "color": "#9270ff"
}
```
- shape yalnızca cube, sphere, cone, torus veya cylinder olabilir.
- color geçerli bir hex renk kodu olsun.

KOD:
- Kod istendiğinde çalışır, açıklanmış ve uygun kod ver.
- Gerçekte çalıştırmadığın kodu çalıştırdığını iddia etme.
- Özel grafik, geometri ve 3D bloklarının içine HTML veya JavaScript koyma.



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
