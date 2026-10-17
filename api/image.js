export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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

  // Türkçe isteği, ana konuyu koruyan net bir İngilizce tarife dönüştür.
  async function improveImagePrompt(originalPrompt) {
    const groqKey = process.env.GROQ_API_KEY;

    // Groq anahtarı yoksa eski yöntemle devam et.
    if (!groqKey) return originalPrompt;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              {
                role: "system",
                content: [
                  "Convert the user's request into a precise English image-generation prompt.",
                  "Preserve the exact requested main subject, action, number of objects, colors, style and background.",
                  "Never replace the main subject with a landscape or scenery.",
                  "Do not add unrelated objects, people or scenery.",
                  "If the user asks to draw a single object without specifying a background, show the entire object clearly, centered, against a simple neutral background.",
                  "For example, 'bardak çiz' means a drinking glass should be the main subject, not a landscape.",
                  "Keep all explicitly requested details. Do not invent a different scene.",
                  "Return only the final English prompt. No explanation or quotation marks."
                ].join(" ")
              },
              {
                role: "user",
                content: originalPrompt
              }
            ],
            temperature: 0.1,
            max_completion_tokens: 400,
            reasoning_effort: "low",
            include_reasoning: false
          })
        }
      );

      if (!response.ok) {
        console.warn("Image prompt conversion failed; using original prompt.");
        return originalPrompt;
      }

      const data = await response.json();
      const improved =
        data?.choices?.[0]?.message?.content?.trim();

      return improved
        ? improved.slice(0, 1800)
        : originalPrompt;
    } catch (error) {
      console.warn("Image prompt conversion failed; using original prompt.");
      return originalPrompt;
    }
  }

  try {
    const imagePrompt = await improveImagePrompt(prompt);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          steps: 4
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      console.error("Cloudflare image API error:", data);

      const errors = Array.isArray(data.errors)
        ? data.errors.map(e => e.message).filter(Boolean).join(" ")
        : "";

      return res.status(response.ok ? 502 : response.status).json({
        error: errors || "Cloudflare görsel üretimi başarısız oldu."
      });
    }

    const image = data.result?.image;

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
