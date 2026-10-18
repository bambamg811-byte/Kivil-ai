
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Yalnızca POST isteği destekleniyor."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY Vercel ayarlarında bulunamadı."
    });
  }

  const prompt =
    typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";
  const image =
    typeof req.body?.image === "string"
      ? req.body.image
      : "";

  if (!prompt) {
    return res.status(400).json({
      error: "Görüntü hakkında bir soru yaz."
    });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({
      error: "Soru en fazla 2000 karakter olabilir."
    });
  }

  const match = image.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    return res.status(400).json({
      error: "Geçerli bir JPEG, PNG veya WebP görseli gönder."
    });
  }

  if (image.length > 1500000) {
    return res.status(413).json({
      error: "Görsel çok büyük. Daha küçük bir kare yakala."
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: image }
                }
              ]
            }
          ],
          temperature: 0.2,
          max_completion_tokens: 1200
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "Groq vision error:",
        response.status,
        data?.error?.message
      );

      return res.status(502).json({
        error:
          response.status === 429
            ? "Groq kullanım limiti doldu. Daha sonra tekrar dene."
            : "Görüntü analizi başarısız oldu. Vercel günlüklerini kontrol et."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "Görüntü analizi boş yanıt döndürdü."
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Kıvıl vision error:", error);

    return res.status(500).json({
      error: "Görüntü analiz servisine bağlanılamadı."
    });
  }
}
