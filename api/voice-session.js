export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST isteği gerekli." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const requiredCode = process.env.KIVIL_VOICE_ACCESS_CODE;

  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_API_KEY Vercel ortam değişkenlerinde bulunamadı."
    });
  }

  if (!requiredCode) {
    return res.status(503).json({
      error: "Sesli modu korumak için Vercel'de KIVIL_VOICE_ACCESS_CODE değişkenini ayarla."
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const suppliedCode = typeof body?.accessCode === "string" ? body.accessCode : "";
  if (suppliedCode.length !== requiredCode.length || suppliedCode !== requiredCode) {
    return res.status(401).json({ error: "Sesli mod erişim kodu yanlış." });
  }

  const sdp = typeof body?.sdp === "string" ? body.sdp : "";
  if (!sdp || sdp.length > 150000) {
    return res.status(400).json({ error: "Geçerli bir ses bağlantısı isteği gerekli." });
  }

  const allowedModels = new Set([
    "gpt-realtime-2.1-mini",
    "gpt-realtime-2.1"
  ]);
  const requestedModel = typeof body?.model === "string" ? body.model : "";
  const model = allowedModels.has(requestedModel)
    ? requestedModel
    : "gpt-realtime-2.1-mini";

  const session = {
    type: "realtime",
    model,
    instructions: [
      "Sen Kıvıl AI adlı, Türkçe konuşan bir sesli yapay zekâ asistanısın.",
      "Doğal, sıcak, akıcı ve anlaşılır Türkçe kullan. Kullanıcının ne demek istediğini dikkatle dinle.",
      "Konuşma tarzını duruma göre ayarla: mutlu veya heyecanlı bir konuda enerjik ve neşeli; kullanıcı üzgün veya endişeliyse sakin, anlayışlı ve destekleyici; teknik konularda net ve kendinden emin; mizaha uygun olduğunda hafif esprili ol.",
      "Ses tonunu, konuşma hızını ve vurguyu doğal biçimde değiştir. Duyguyu abartma, kullanıcıyı taklit ederek alaya alma.",
      "Gerçek bir insan olduğunu veya gerçek duygular yaşadığını iddia etme. Kullanıcının duygusunu kesin teşhis etme; sesinden emin olmadığın çıkarımlar yapma.",
      "Kısa, konuşma diline uygun yanıtlar ver. Kullanıcı ayrıntı isterse ayrıntılandır. Uzun Markdown tabloları veya kod bloklarını sesli yanıtta okumak yerine kısaca açıkla.",
      "Kullanıcı konuşurken araya girdiğinde dur ve yeni sözünü dinle. Kullanıcının sözünü bitirip bitirmediğinden emin değilsen doğal bir kısa duraklama yap.",
      "Bilmediğin bilgileri uydurma. Güncel bilgiye erişimin yoksa bunu açıkça söyle. Gizli anahtarları veya özel bilgileri açıklama.",
      "Kıvıl AI'ın metin sohbeti, kamera ve diğer özelliklerinin varlığını ancak gerçekten kullanılabilir oldukları ölçüde belirt."
    ].join(" "),
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: { model: "gpt-realtime-whisper", language: "tr" },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "medium",
          create_response: true,
          interrupt_response: true
        }
      },
      output: { voice: "marin" }
    }
  };

  try {
    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify(session));

    const upstream = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey },
      body: form
    });

    const answer = await upstream.text();

    if (!upstream.ok) {
      let message = "OpenAI ses bağlantısı kurulamadı.";
      try {
        const parsed = JSON.parse(answer);
        message = parsed?.error?.message || message;
      } catch {}
      console.error("Kıvıl realtime error:", upstream.status, message);
      return res.status(502).json({
        error: "OpenAI ses servisi (" + upstream.status + "): " + message
      });
    }

    if (!answer || answer.length > 150000) {
      return res.status(502).json({ error: "Ses sunucusundan geçerli bağlantı yanıtı alınamadı." });
    }

    return res.status(200).json({ sdp: answer });
  } catch (error) {
    console.error("Kıvıl voice session error:", error);
    return res.status(500).json({ error: "Sesli görüşme başlatılırken sunucu hatası oluştu." });
  }
}
