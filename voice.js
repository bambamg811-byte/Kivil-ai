(() => {
  "use strict";

  function init() {
    const modeRow = document.querySelector(".mode-row");
    const modeNote = document.querySelector("#modeNote");
    if (!modeRow || !modeNote) return;

    const style = document.createElement("style");
    style.textContent = [
      ".mode-btn.voice{border-color:#3b6e85;background:#102a3a;color:#b6efff}",
      ".kv-voice-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:12px;background:#03050ee8;backdrop-filter:blur(12px)}",
      ".kv-voice-backdrop[hidden]{display:none}",
      ".kv-voice-dialog{width:min(760px,100%);max-height:94vh;overflow:auto;background:radial-gradient(ellipse at 50% 0%,#1b2550 0,transparent 52%),#0b1021;border:1px solid #343d65;border-radius:24px;padding:clamp(15px,3vw,26px);color:#f4f5ff;box-shadow:0 24px 90px #0009}",
      ".kv-voice-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
      ".kv-voice-title{font:700 23px 'Space Grotesk',sans-serif;margin:0}",
      ".kv-voice-sub,.kv-voice-note{color:#a1abc9;font-size:12px;line-height:1.6;margin:6px 0 0}",
      ".kv-voice-close{width:38px;height:38px;border:1px solid #333e61;background:#111a31;color:#f2f4ff;border-radius:12px;font-size:18px}",
      ".kv-voice-center{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 0 14px}",
      ".kv-voice-orb{width:104px;height:104px;border-radius:34px;display:grid;place-items:center;font-size:42px;background:linear-gradient(140deg,#40276d,#15516a);border:1px solid #6a70c0;box-shadow:0 0 0 10px #7c7aff0a,0 0 45px #5e73ff25;transition:transform .2s,box-shadow .2s}",
      ".kv-voice-orb.listening{animation:kvListen 1.8s ease-in-out infinite}",
      ".kv-voice-orb.speaking{animation:kvSpeak .8s ease-in-out infinite alternate;box-shadow:0 0 0 12px #44dbff12,0 0 55px #38dfff4a}",
      ".kv-voice-state{font-size:14px;font-weight:700;color:#e3e7ff}",
      ".kv-voice-detail{font-size:11px;color:#8f9aba;text-align:center}",
      "@keyframes kvListen{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}",
      "@keyframes kvSpeak{from{transform:scale(1)}to{transform:scale(1.07)}}",
      ".kv-voice-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}",
      ".kv-voice-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#b8c1df;min-width:0}",
      ".kv-voice-field select,.kv-voice-field input{width:100%;min-width:0;background:#080d1b;color:#f4f5ff;border:1px solid #354064;border-radius:11px;padding:11px;font:inherit}",
      ".kv-voice-buttons{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}",
      ".kv-voice-btn{border:1px solid #354064;background:#131b32;color:#e7ebff;border-radius:12px;padding:11px 15px;font:600 13px 'DM Sans',sans-serif}",
      ".kv-voice-primary{background:linear-gradient(110deg,#754ce0,#157d9b);border-color:#786ce0;color:#fff}",
      ".kv-voice-danger{border-color:#74394c;background:#321725;color:#ffdce6}",
      ".kv-voice-btn:disabled{opacity:.45;cursor:not-allowed}",
      ".kv-voice-transcript{display:flex;flex-direction:column;gap:8px;min-height:72px;max-height:24vh;overflow:auto;padding:12px;margin-top:14px;background:#070b17;border:1px solid #283251;border-radius:14px}",
      ".kv-voice-empty{color:#727e9f;font-size:12px;line-height:1.6;text-align:center;margin:auto;padding:14px}",
      ".kv-voice-line{max-width:92%;padding:10px 12px;border:1px solid #293556;background:#111a30;border-radius:13px;font-size:13px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}",
      ".kv-voice-line.user{align-self:flex-end;background:#242044;border-color:#433b73;border-radius:13px 4px 13px 13px}",
      ".kv-voice-line.assistant{align-self:flex-start;background:#102333;border-color:#25465b;border-radius:4px 13px 13px 13px}",
      ".kv-voice-error{color:#ffb5c2;font-size:12px;line-height:1.5;margin-top:10px;overflow-wrap:anywhere}",
      ".kv-voice-privacy{padding:10px 12px;border-radius:12px;background:#11182a;border:1px solid #29324d;color:#99a5c6;font-size:11px;line-height:1.6;margin-top:12px}",
      "@media(max-width:520px){.kv-voice-controls{grid-template-columns:1fr}.kv-voice-dialog{border-radius:18px}.kv-voice-title{font-size:20px}.kv-voice-orb{width:88px;height:88px;border-radius:28px;font-size:36px}}"
    ].join("");
    document.head.append(style);

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "mode-btn voice";
    openBtn.textContent = "🎙️ Canlı ses";
    openBtn.setAttribute("aria-haspopup", "dialog");
    modeRow.insertBefore(openBtn, modeNote);

    const modal = document.createElement("div");
    modal.className = "kv-voice-backdrop";
    modal.hidden = true;
    modal.innerHTML =
      '<section class="kv-voice-dialog" role="dialog" aria-modal="true" aria-labelledby="kvVoiceTitle">' +
        '<div class="kv-voice-head"><div><h2 class="kv-voice-title" id="kvVoiceTitle">Kıvıl Canlı Ses</h2>' +
        '<p class="kv-voice-sub">Doğal konuşma, canlı yanıt ve konuşma sırasında araya girebilme.</p></div>' +
        '<button class="kv-voice-close" type="button" data-close aria-label="Görüşmeyi kapat">✕</button></div>' +
        '<div class="kv-voice-center"><div class="kv-voice-orb" data-orb aria-hidden="true">✦</div>' +
        '<div class="kv-voice-state" data-state>Görüşmeye hazır</div><div class="kv-voice-detail" data-detail>Mikrofon, yalnızca başlattığında açılır.</div></div>' +
        '<div class="kv-voice-controls">' +
          '<label class="kv-voice-field">Ses kalitesi<select data-model><option value="gpt-realtime-2.1-mini">Dengeli, daha uygun maliyetli</option><option value="gpt-realtime-2.1">En yüksek kalite, daha pahalı</option></select></label>' +
          '<label class="kv-voice-field">Özel erişim kodu<input data-code type="password" autocomplete="off" spellcheck="false" placeholder="Vercel kodunu buraya yaz"></label>' +
        '</div>' +
        '<div class="kv-voice-buttons"><button class="kv-voice-btn kv-voice-primary" data-start type="button">🎙️ Görüşmeyi başlat</button>' +
        '<button class="kv-voice-btn kv-voice-danger" data-stop type="button" disabled>■ Görüşmeyi bitir</button></div>' +
        '<div class="kv-voice-transcript" data-transcript aria-live="polite"><div class="kv-voice-empty" data-empty>Görüşme başlayınca burada konuşma metinleri görünür.</div></div>' +
        '<div class="kv-voice-error" data-error hidden></div>' +
        '<div class="kv-voice-privacy">Gizlilik: mikrofon görüşme başlayınca açılır ve görüşme bitince kapatılır. Konuşma metinleri mevcut Kıvıl sohbet geçmişine eklenir. Bu özellik OpenAI API kullanır ve kullanım ücrete tabi olabilir. Erişim kodunu kimseyle paylaşma.</div>' +
      '</section>';
    document.body.append(modal);

    const stateEl = modal.querySelector("[data-state]");
    const detailEl = modal.querySelector("[data-detail]");
    const orb = modal.querySelector("[data-orb]");
    const startBtn = modal.querySelector("[data-start]");
    const stopBtn = modal.querySelector("[data-stop]");
    const closeButtons = modal.querySelectorAll("[data-close]");
    const modelSelect = modal.querySelector("[data-model]");
    const codeInput = modal.querySelector("[data-code]");
    const transcriptEl = modal.querySelector("[data-transcript]");
    const emptyEl = modal.querySelector("[data-empty]");
    const errorEl = modal.querySelector("[data-error]");
    const app = window.KivilCameraBridge;

    let pc = null;
    let micStream = null;
    let eventChannel = null;
    let remoteAudio = null;
    let isStarting = false;
    let isActive = false;
    let currentUserText = null;
    let currentAssistantText = "";
    let currentAssistantTextFallback = "";
    let assistantBubble = null;
    let userBubble = null;
    let userSaved = false;
    let assistantSaved = false;
    let responseFinished = false;
    let saveFallbackTimer = null;

    function setState(label, detail, kind) {
      stateEl.textContent = label;
      detailEl.textContent = detail || "";
      orb.classList.remove("listening", "speaking");
      if (kind === "listening" || kind === "speaking") orb.classList.add(kind);
    }

    function showError(message) {
      errorEl.hidden = false;
      errorEl.textContent = message || "Bilinmeyen bir hata oluştu.";
    }

    function clearError() {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    function addBubble(role, text) {
      if (emptyEl && emptyEl.isConnected) emptyEl.remove();
      const bubble = document.createElement("div");
      bubble.className = "kv-voice-line " + (role === "user" ? "user" : "assistant");
      bubble.textContent = text || "";
      transcriptEl.append(bubble);
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
      return bubble;
    }

    function saveToChat(role, content) {
      const clean = String(content || "").trim();
      if (!clean || !app || typeof app.ensureChat !== "function") return;
      const chat = app.ensureChat(clean);
      chat.messages.push({ role: role, content: clean });
      chat.updatedAt = Date.now();
      if (typeof app.saveChats === "function") app.saveChats();
      if (typeof app.renderHistory === "function") app.renderHistory();
      if (typeof app.addMessage === "function") app.addMessage(role, clean, { scroll: false });
    }

    function finalizeTurn(force) {
      const assistantText = String(currentAssistantText || currentAssistantTextFallback || "").trim();
      if (currentUserText !== null && !userSaved && String(currentUserText).trim()) {
        saveToChat("user", currentUserText);
        userSaved = true;
      }
      if (responseFinished && assistantText && !assistantSaved && (currentUserText !== null || force)) {
        saveToChat("assistant", assistantText);
        assistantSaved = true;
      }
    }

    function collectFinalText(response) {
      if (!response || !Array.isArray(response.output)) return "";
      const parts = [];
      response.output.forEach(function(item) {
        (Array.isArray(item.content) ? item.content : []).forEach(function(content) {
          if (content && typeof content.transcript === "string") parts.push(content.transcript);
          else if (content && typeof content.text === "string") parts.push(content.text);
        });
      });
      return parts.join(" ").trim();
    }

    function resetTurn() {
      if (saveFallbackTimer) clearTimeout(saveFallbackTimer);
      saveFallbackTimer = null;
      currentUserText = null;
      currentAssistantText = "";
      currentAssistantTextFallback = "";
      assistantBubble = null;
      userBubble = null;
      userSaved = false;
      assistantSaved = false;
      responseFinished = false;
    }

    function handleEvent(event) {
      if (!event || typeof event.type !== "string") return;

      if (event.type === "error") {
        showError(event.error && event.error.message ? event.error.message : "Ses bağlantısı bir hata döndürdü.");
        setState("Bir hata oluştu", "Görüşmeyi durdurup tekrar deneyebilirsin.");
        return;
      }

      if (event.type === "input_audio_buffer.speech_started") {
        finalizeTurn(true);
        resetTurn();
        setState("Seni dinliyorum", "Konuşabilirsin. Kıvıl yanıt verirken de araya girebilirsin.", "listening");
        return;
      }

      if (event.type === "input_audio_buffer.speech_stopped") {
        setState("Seni dinledim", "Yanıt hazırlanıyor…");
        return;
      }

      if (event.type === "conversation.item.input_audio_transcription.completed") {
        const text = String(event.transcript || "").trim();
        if (!text) return;
        currentUserText = text;
        if (userBubble) userBubble.textContent = text;
        else userBubble = addBubble("user", text);
        finalizeTurn(false);
        return;
      }

      if (event.type === "response.created") {
        currentAssistantText = "";
        currentAssistantTextFallback = "";
        assistantBubble = null;
        assistantSaved = false;
        responseFinished = false;
        setState("Kıvıl yanıtlıyor", "Yanıt canlı olarak oluşturuluyor.", "speaking");
        return;
      }

      if (event.type === "response.output_audio_transcript.delta") {
        currentAssistantText += String(event.delta || "");
        if (!assistantBubble) assistantBubble = addBubble("assistant", "");
        assistantBubble.textContent = currentAssistantText;
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
        setState("Kıvıl konuşuyor", "İstersen konuşma sırasında araya girebilirsin.", "speaking");
        return;
      }

      if (event.type === "response.output_audio_transcript.done") {
        if (typeof event.transcript === "string" && event.transcript.trim()) {
          currentAssistantText = event.transcript.trim();
        }
        if (currentAssistantText) {
          if (!assistantBubble) assistantBubble = addBubble("assistant", currentAssistantText);
          assistantBubble.textContent = currentAssistantText;
          finalizeTurn(false);
        }
        return;
      }

      if (event.type === "response.output_text.delta") {
        currentAssistantTextFallback += String(event.delta || "");
        if (!currentAssistantText && currentAssistantTextFallback) {
          if (!assistantBubble) assistantBubble = addBubble("assistant", "");
          assistantBubble.textContent = currentAssistantTextFallback;
          transcriptEl.scrollTop = transcriptEl.scrollHeight;
        }
        return;
      }

      if (event.type === "response.done") {
        const finalText = collectFinalText(event.response);
        if (!currentAssistantText && !currentAssistantTextFallback && finalText) {
          currentAssistantText = finalText;
        }
        responseFinished = true;
        const displayText = currentAssistantText || currentAssistantTextFallback;
        if (displayText) {
          if (!assistantBubble) assistantBubble = addBubble("assistant", displayText);
          assistantBubble.textContent = displayText;
          finalizeTurn(false);
          if (!assistantSaved) {
            if (saveFallbackTimer) clearTimeout(saveFallbackTimer);
            saveFallbackTimer = setTimeout(function() { finalizeTurn(true); }, 3500);
          }
        }
        if (isActive) setState("Seni dinliyorum", "Konuşmaya devam edebilirsin.", "listening");
        return;
      }

      if (event.type === "session.updated") {
        setState("Bağlantı hazır", "Konuşmaya başlayabilirsin.", "listening");
      }
    }

    function cleanup(updateStatus) {
      isStarting = false;
      isActive = false;
      if (saveFallbackTimer) clearTimeout(saveFallbackTimer);
      saveFallbackTimer = null;
      if (eventChannel) {
        try { eventChannel.close(); } catch {}
      }
      eventChannel = null;
      if (pc) {
        try { pc.close(); } catch {}
      }
      pc = null;
      if (micStream) micStream.getTracks().forEach(function(track) { track.stop(); });
      micStream = null;
      if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
        remoteAudio.remove();
      }
      remoteAudio = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      modelSelect.disabled = false;
      codeInput.disabled = false;
      orb.classList.remove("listening", "speaking");
      if (updateStatus) setState("Görüşme sona erdi", "Mikrofon kapatıldı. Yeniden başlatabilirsin.");
    }

    async function startCall() {
      if (isStarting || isActive) return;
      clearError();

      const suppliedCode = codeInput.value.trim();
      if (!suppliedCode) {
        showError("Önce Vercel'de ayarladığın KIVIL_VOICE_ACCESS_CODE değerini yaz.");
        codeInput.focus();
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) {
        showError("Bu tarayıcı canlı ses bağlantısını desteklemiyor. HTTPS kullanan güncel bir tarayıcıda dene.");
        return;
      }

      isStarting = true;
      startBtn.disabled = true;
      modelSelect.disabled = true;
      codeInput.disabled = true;
      setState("Bağlanıyor…", "Mikrofon izni isteniyor.");
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        pc = new RTCPeerConnection();
        remoteAudio = document.createElement("audio");
        remoteAudio.autoplay = true;
        remoteAudio.playsInline = true;
        remoteAudio.setAttribute("aria-label", "Kıvıl'ın canlı ses yanıtı");
        document.body.append(remoteAudio);
        pc.ontrack = function(e) {
          remoteAudio.srcObject = e.streams[0];
          const playPromise = remoteAudio.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function() {
              setState("Ses için tıkla", "Tarayıcı oynatmayı engellediyse sayfada bir kez tıkla.");
            });
          }
        };

        micStream.getTracks().forEach(function(track) { pc.addTrack(track, micStream); });
        eventChannel = pc.createDataChannel("oai-events");
        eventChannel.addEventListener("message", function(message) {
          try { handleEvent(JSON.parse(message.data)); } catch {}
        });
        eventChannel.addEventListener("open", function() {
          if (isActive) setState("Seni dinliyorum", "Konuşmaya başlayabilirsin. Kıvıl konuşurken araya girebilirsin.", "listening");
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch("/api/voice-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sdp: offer.sdp,
            model: modelSelect.value,
            accessCode: suppliedCode
          })
        });
        const data = await response.json().catch(function() { return {}; });
        if (!response.ok) throw new Error(data.error || "Ses bağlantısı kurulamadı (" + response.status + ").");
        if (!data.sdp) throw new Error("Ses sunucusu geçerli bağlantı yanıtı göndermedi.");

        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
        isActive = true;
        isStarting = false;
        stopBtn.disabled = false;
        startBtn.disabled = true;
        setState("Seni dinliyorum", "Konuşmaya başlayabilirsin. Yanıt verirken araya girebilirsin.", "listening");
      } catch (error) {
        cleanup(false);
        setState("Bağlantı kurulamadı", "Ayarları ve mikrofon iznini kontrol et.");
        showError(error && error.message ? error.message : "Bilinmeyen bir bağlantı hatası oluştu.");
      }
    }

    function stopCall() {
      finalizeTurn(true);
      cleanup(true);
    }

    function openModal() {
      modal.hidden = false;
      clearError();
      if (!isActive && !isStarting) setState("Görüşmeye hazır", "Mikrofon, yalnızca başlattığında açılır.");
      startBtn.focus();
    }

    function closeModal() {
      stopCall();
      modal.hidden = true;
      codeInput.value = "";
      codeInput.disabled = false;
    }

    openBtn.addEventListener("click", openModal);
    startBtn.addEventListener("click", startCall);
    stopBtn.addEventListener("click", stopCall);
    closeButtons.forEach(function(button) { button.addEventListener("click", closeModal); });
    modal.addEventListener("click", function(event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
    window.addEventListener("pagehide", function() { cleanup(false); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
