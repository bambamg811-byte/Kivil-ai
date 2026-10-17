export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST istekleri destekleniyor."
    });
  }

  if (!process.env.FAL_KEY) {
    return res.status(500).json({
      error: "FAL_KEY Vercel ayarlarında bulunamadı."
    });
  }

  try {
    const { prompt, imageUrl, mode = "text" } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Bir video açıklaması yazmalısın."
      });
    }

    if (prompt.length > 1500) {
      return res.status(400).json({
        error: "Video açıklaması en fazla 1500 karakter olabilir."
      });
    }

    if (!["text", "image"].includes(mode)) {
      return res.status(400).json({
        error: "Geçersiz video modu."
      });
    }

    if (mode === "image" && !imageUrl) {
      return res.status(400).json({
        error: "Görselden video için görsel URL'si gerekli."
      });
    }

    const endpoint =
      mode === "image"
        ? "fal-ai/wan/v2.2-5b/image-to-video"
        : "fal-ai/wan/v2.2-5b/text-to-video";

    const input = { prompt };

    if (mode === "image") {
      let parsedUrl;

      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return res.status(400).json({
          error: "Geçerli bir görsel URL'si gir."
        });
      }

      if (parsedUrl.protocol !== "https:") {
        return res.status(400).json({
          error: "Görsel URL'si HTTPS kullanmalı."
        });
      }

      input.image_url = parsedUrl.href;
    }

    const response = await fetch(
      `https://fal.run/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Video API hatası:", data);

      return res.status(response.status).json({
        error: data?.detail
          ? "Video servisi isteği reddetti."
          : "Video oluşturulamadı. API ayarlarını kontrol et."
      });
    }

    const videoUrl = data?.video?.url;

    if (!videoUrl) {
      return res.status(502).json({
        error: "Video servisi sonuç döndürmedi."
      });
    }

    return res.status(200).json({
      success: true,
      videoUrl
    });
  } catch (error) {
    console.error("Video oluşturma hatası:", error);

    return res.status(500).json({
      error: "Video oluşturulurken beklenmeyen bir hata oluştu."
    });
  }
}
