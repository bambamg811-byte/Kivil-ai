

export default async function handler(req, res) {
  // Yalnızca POST isteklerini kabul et
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Yalnızca POST isteği destekleniyor."
    });
  }

  // API anahtarı kontrolü
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY Vercel ortam değişkenlerinde bulunamadı."
    });
  }

  // İstemden açıklamayı al
  const prompt =
    typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";

  if (!prompt) {
    return res.status(400).json({
      error: "Lütfen oluşturulacak görseli tarif et."
    });
  }

  if (prompt.length > 4000) {
    return res.status(400).json({
      error: "Görsel açıklaması en fazla 4000 karakter olabilir."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
          quality: "low",
          output_format: "jpeg"
        })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("OpenAI image API error:", result);

      return res.status(response.status).json({
        error:
          result?.error?.message ||
          `Görsel API hatası: ${response.status}`
      });
    }

    const image = result?.data?.[0]?.b64_json;

    if (!image) {
      console.error("Image response did not contain b64_json");

      return res.status(502).json({
        error: "API yanıt verdi ancak görsel verisi bulunamadı."
      });
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${image}`
    });
  } catch (error) {
    console.error("Image generation error:", error);

    return res.status(500).json({
          error: "Resim servisine bağlanırken hata oluştu."
    });
  }
}
      error: "Resim servisine bağlanırken hata oluştu."
    });
  }
}
