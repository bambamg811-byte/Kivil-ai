
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Yalnızca POST isteği destekleniyor."
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({
      error: "Cloudflare API anahtarı veya Account ID eksik."
    });
  }

  const prompt =
    typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";

  if (!prompt) {
    return res.status(400).json({
      error: "Lütfen oluşturulacak görseli tarif et."
    });
  }

  if (prompt.length > 2048) {
    return res.status(400).json({
      error: "Görsel açıklaması en fazla 2048 karakter olabilir."
    });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          steps: 4
        })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      console.error("Cloudflare image API error:", result);

      const errors = Array.isArray(result.errors)
        ? result.errors.map(e => e.message).filter(Boolean).join(" ")
        : "";

      return res.status(response.ok ? 502 : response.status).json({
        error: errors || "Cloudflare görsel üretimi başarısız oldu."
      });
    }

    const image = result.result?.image;

    if (!image) {
      return res.status(502).json({
        error: "Cloudflare yanıtında görsel verisi bulunamadı."
      });
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${image}`
    });
  } catch (error) {
    console.error("Cloudflare image generation error:", error);

    return res.status(500).json({
      error: "Görsel servisine bağlanırken hata oluştu."
    });
  }
}
