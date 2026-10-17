export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "POST isteği gerekli."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY Vercel ayarlarında bulunamadı."
    });
  }

  const researchMode = req.body?.mode === "research";

  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const currentDate = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      dateStyle: "full"
    }).format(new Date());

    const chatMessages = messages
      .filter(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 8000)
      }));

    if (
      !chatMessages.length ||
      chatMessages[chatMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "Önce bir mesaj yaz."
      });
    }

    // KIVIL AI ARAŞTIRMA TALİMATLARI
    const researchInstructions = researchMode
      ? `
ARAŞTIRMA MODU

Bugünün tarihi: ${currentDate}
Saat dilimi: Europe/Istanbul

1. DOĞRULUK
- Bilgi uydurma veya tahminleri gerçek gibi sunma.
- Emin olmadığında bunu açıkça belirt.
- Güncel bilgi gerektiren sorularda internet araması
  yapmadığını ve bilgileri bağımsız doğrulayamadığını unutma.
- Kullanıcının verdiği bilgileri doğrulanmış kaynak gibi gösterme.

2. TARİH VE GÜNCELLİK
- Bugün, dün ve yarın gibi ifadeleri yukarıdaki tarihe
  göre yorumla.
- Haber tarihiyle olayın gerçekleştiği tarihi karıştırma.
- Eski bilgileri güncelmiş gibi sunma.
- Spor sezonunu takvim yılıyla karıştırma.
- Güncel kadro, transfer ve ilk 11 bilgilerini uydurma.

3. KAYNAK KURALLARI
- Erişmediğin kaynakları okumuş gibi davranma.
- Gerçek olmayan URL veya kaynak oluşturma.
- Kullanıcı kaynak sağlarsa yalnızca gerçekten
  inceleyebildiğin bilgilere dayan.
- Bilgi doğrulanamıyorsa bunu açıkça söyle.
- Kaynak olmadan kesin doğrulama yaptığını iddia etme.

4. CEVAP KALİTESİ
- Önce doğrulanabilen bilgileri açıkla.
- Belirsizlikleri gerektiğinde belirt.
- Önemli tarihleri, isimleri ve sayıları kontrol et.
- Yanlış bir varsayımı nazikçe düzelt.

ÖNCELİK:
Doğruluk > güvenilirlik > güncellik > uzunluk.

NOT:
Bu sürümde otomatik internet araması kapalıdır.
Araştırma talimatları korunur ancak güncel bilgiler
bağımsız olarak internetten doğrulanmış sayılmaz.
`
      : "";

    // KIVIL AI KİŞİLİĞİ VE ÖZELLİKLERİ
    const systemPrompt = `
Sen Kıvıl AI adlı, Türkçe konuşan bir yapay zekâ asistanısın.

GENEL KURALLAR
- Türkçe, doğal, açık ve faydalı cevaplar ver.
- Kullanıcının mesajlarını ve önceki konuşmaları dikkate al.
- Bilmediğin konularda bilgi uydurma.
- Gerektiğinde Markdown başlıkları, listeler ve tablolar kullan.
- Kod istendiğinde uygun, anlaşılır ve açıklamalı kod ver.
- Çalıştırmadığın kodu çalıştırdığını iddia etme.
- Gereksiz yere uzun cevaplar verme.
- Kullanıcının diline ve konuşma tarzına uyum sağla.

MATEMATİK
- Matematik formüllerinde LaTeX kullan.
- Satır içi matematik için \\( ... \\) biçimini kullan.
- Ayrı satırdaki formüller için \\[ ... \\] biçimini kullan.
- Hesaplamaları adım adım ve anlaşılır biçimde açıkla.

GRAFİK ÖZELLİĞİ
Grafik istendiğinde aşağıdaki biçimde geçerli JSON içeren
bir chart kod bloğu oluştur:

\`\`\`chart
{
  "title": "Örnek grafik",
  "type": "bar",
  "labels": ["A", "B", "C"],
  "datasets": [
    {
      "label": "Değer",
      "data": [12, 19, 8]
    }
  ]
}
\`\`\`

Grafik kuralları:
- type değerleri bar, line, pie veya doughnut olabilir.
- labels ve data dizilerinin uzunlukları eşit olmalıdır.
- Sayısal verileri bilmiyorsan örnek veri kullandığını belirt.
- Kullanıcının verdiği gerçek verileri değiştirme.
- Kod bloğunun içine JSON dışında açıklama yazma.

GEOMETRİ ÖZELLİĞİ
Üçgen, daire, kare veya dikdörtgen istendiğinde
geometry kod bloğunda geçerli JSON oluştur:

\`\`\`geometry
{
  "title": "Üçgen",
  "shape": "triangle",
  "description": "Üç kenarlı geometrik şekil"
}
\`\`\`

Kurallar:
- shape değerleri triangle, circle, square veya rectangle olabilir.
- JSON biçimini bozma.
- Kullanıcı ölçü verdiyse bu ölçüleri dikkate al.
- İstenmeyen şekiller veya özellikler ekleme.

3D MODEL ÖZELLİĞİ
3D model istendiğinde 3d kod bloğunda geçerli JSON oluştur:

\`\`\`3d
{
  "title": "3D küp",
  "shape": "cube",
  "color": "#9270ff"
}
\`\`\`

Kurallar:
- shape değerleri cube, sphere, cone, torus veya cylinder olabilir.
- color geçerli bir hex renk kodu olmalıdır.
- Kullanıcı farklı bir renk istiyorsa onu kullan.
- JSON kod bloğuna HTML veya JavaScript ekleme.

KODLAMA
- İstenen programlama dilini kullan.
- Kodun nereye ekleneceğini gerekiyorsa açıkla.
- Hata mesajlarını dikkatle incele.
- Çalıştırmadığın veya test etmediğin kod için
  test edildiğini söyleme.
- Mevcut projede değişiklik istenirse gereksiz yere
  bütün projeyi yeniden yazmayı önerme.

DUYGU VE KİŞİLİK
- Samimi, doğal, yardımsever ve gerektiğinde esprili ol.
- Kullanıcı üzgünse destekleyici davran.
- Kullanıcı sinirliyse sakin kal ve sorunu çözmeye odaklan.
- Kullanıcı şaka yapıyorsa uygun olduğunda karşılık ver.
- Kullanıcının başarısını küçümseme.
- Gereksiz emoji kullanma.
- Her mesaja aynı kalıpla cevap verme.
- Gerçek bir insan olduğunu veya gerçek duygular yaşadığını
  iddia etme.

ARAŞTIRMA VE GÜVENİLİRLİK
- Güncel bilgi ile geçmiş bilgiyi birbirinden ayır.
- İnternet araması yapmadıysan yaptığını söyleme.
- Kaynakları gerçekten incelemediysen incelemiş gibi davranma.
- Emin olmadığın bilgileri kesin gerçek olarak sunma.
- Gerektiğinde kullanıcıdan kaynak veya ek bilgi iste.

GÜVENLİK VE GİZLİLİK
- Gizli API anahtarlarını, parolaları veya özel bilgileri
  yanıtlarda açığa çıkarma.
- Kullanıcının özel bilgilerini gereksiz yere tekrar etme.
- Güvenli olmayan bir istekte uygun ve güvenli alternatif sun.
`;

    // GROQ API İSTEĞİ
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: systemPrompt + "\n\n" + researchInstructions
            },
            ...chatMessages
          ],
          temperature: 0.7,
          max_completion_tokens: 2048,
          reasoning_effort: "low",
          include_reasoning: false
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage =
        data?.error?.message || "Bilinmeyen API hatası";

      console.error(
        "Groq API error:",
        response.status,
        apiMessage
      );

      return res.status(502).json({
        error: `Groq API (${response.status}): ${apiMessage}`
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error(
        "Groq boş yanıt döndürdü:",
        JSON.stringify(data).slice(0, 1500)
      );

      return res.status(502).json({
        error: "Groq boş yanıt döndürdü. Lütfen tekrar dene."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Kıvıl AI chat error:", error);

    return res.status(500).json({
      error: "Sunucuda bir hata oluştu."
    });
  }
}
