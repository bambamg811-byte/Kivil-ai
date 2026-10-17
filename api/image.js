
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Yalnızca POST isteği destekleniyor."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY Vercel ayarlarında bulunamadı."
    });
  }

  const prompt =
    typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";

  if (!prompt) {
    return res.status(400).json({
      error: "Lütfen çizilecek resmi tarif et."
    });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({
      error: "Resim açıklaması en fazla 2000 karakter olabilir."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-image-2.5-flare",
          prompt,
          size: "1024x1024",
          quality: "low",
          output_format: "jpeg"
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Image API error:", result.error?.code);

      return res.status(
        response.status >= 400 && response.status < 500
          ? response.status
          : 502
      ).json({
        error:
          result.error?.message ||
          "Resim oluşturulamadı. API ayarlarını kontrol et."
      });
    }

    const image = result.data?.[0]?.b64_json;

    if (!image) {
      return res.status(502).json({
        error: "API resim döndürmedi."
      });
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${image}`
    });
  } catch (error) {
    console.error("Image generation failed:", error.message);

    return res.status(500).json({
      error: "Resim servisine bağlanırken hata oluştu."
    });
  }
}
