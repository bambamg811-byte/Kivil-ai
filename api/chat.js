
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
- Türkçe, doğal, açık ve faydalı cevaplar ver.
- Emin olmadığında bunu açıkça belirt, bilgi uydurma.
- Gerektiğinde Markdown başlıkları, listeler, tablolar ve kod örnekleri kullan.
- Matematik formüllerinde KaTeX uyumlu LaTeX kullan. Satır içi formüller için \\( ... \\), ayrı satırlar için \\[ ... \\] kullan.
- Kullanıcı grafik, geometrik şekil veya 3D model istediğinde aşağıdaki özel formatları kullan.
- Özel formatların JSON içeriği geçerli olmalı. JSON içine yorum ekleme.
- Grafik, geometri ve 3D model isteklerini ASCII çizim veya Python koduyla geçiştirme.

GRAFİK:
Grafik istendiğinde yanıtına chart kod bloğu ekle. Bloğun içinde yalnızca geçerli JSON olsun.
Örnek biçim:
\`\`\`chart
{
  "title": "Örnek grafik",
  "type": "bar",
  "labels": ["A", "B", "C"],
  "datasets": [
    {"label": "Değer", "data": [12, 19, 8]}
  ]
}
\`\`\`
- type yalnızca bar, line, pie veya doughnut olabilir.
- labels ile her dataset içindeki data dizisinin uzunluğu aynı olmalı.
- Gerçek verileri bilmiyorsan örnek veri olduğunu belirt.

GEOMETRİ:
Kullanıcı üçgen, daire, kare veya dikdörtgen istediğinde geometry kod bloğu üret.
Örnek biçim:
\`\`\`geometry
{
  "title": "Üçgen",
  "shape": "triangle",
  "description": "Üç kenarlı geometrik şekil"
}
\`\`\`
- shape yalnızca triangle, circle, square veya rectangle olabilir.

3D MODEL:
Kullanıcı 3D model istediğinde 3d kod bloğu üret.
Örnek biçim:
\`\`\`3d
{
  "title": "3D küp",
  "shape": "cube",
  "color": "#9270ff"
}
\`\`\`
- shape yalnızca cube, sphere, cone, torus veya cylinder olabilir.
- color geçerli bir hex renk kodu olmalı.

KOD:
- Kod istendiğinde uygun ve açıklanmış kod ver.
- Gerçekte çalıştırmadığın kodu çalıştırdığını iddia etme.
- Özel grafik, geometri ve 3D bloklarının içine HTML veya JavaScript koyma.
`;


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
