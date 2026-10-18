(() => {
  "use strict";

  function init() {
    const modeRow = document.querySelector(".mode-row");
    const modeNote = document.querySelector("#modeNote");
    if (!modeRow || !modeNote || document.querySelector(".kv-voice-backdrop")) return;

    const style = document.createElement("style");
    style.textContent = `
      .mode-btn.voice{border-color:#3b6e85;background:#102a3a;color:#b6efff}
      .kv-voice-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:12px;background:#03050ee8;backdrop-filter:blur(12px)}
      .kv-voice-backdrop[hidden]{display:none}
      .kv-voice-dialog{width:min(760px,100%);max-height:94vh;overflow:auto;background:radial-gradient(ellipse at 50% 0%,#1b2550 0,transparent 52%),#0b1021;border:1px solid #343d65;border-radius:24px;padding:clamp(15px,3vw,26px);color:#f4f5ff;box-shadow:0 24px 90px #0009}
      .kv-voice-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.kv-voice-title{font:700 23px 'Space Grotesk',sans-serif;margin:0}
      .kv-voice-sub,.kv-voice-note{color:#a1abc9;font-size:12px;line-height:1.6;margin:6px 0 0}.kv-voice-close{width:38px;height:38px;border:1px solid #333e61;background:#111a31;color:#f2f4ff;border-radius:12px;font-size:18px}
      .kv-voice-center{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 0 14px}.kv-voice-orb{width:100px;height:100px;border-radius:32px;display:grid;place-items:center;font-size:42px;background:linear-gradient(140deg,#40276d,#15516a);border:1px solid #6a70c0;box-shadow:0 0 0 10px #7c7aff0a,0 0 45px #5e73ff25;transition:transform .2s,box-shadow .2s}
      .kv-voice-orb.listening{animation:kvListen 1.8s ease-in-out infinite}.kv-voice-orb.speaking{animation:kvSpeak .8s ease-in-out infinite alternate;box-shadow:0 0 0 12px #44dbff12,0 0 55px #38dfff4a}
      .kv-voice-state{font-size:14px;font-weight:700;color:#e3e7ff}.kv-voice-detail{font-size:11px;color:#8f9aba;text-align:center}
      @keyframes kvListen{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}@keyframes kvSpeak{from{transform:scale(1)}to{transform:scale(1.07)}}
      .kv-voice-buttons{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.kv-voice-btn{border:1px solid #354064;background:#131b32;color:#e7ebff;border-radius:12px;padding:11px 15px;font:600 13px 'DM Sans',sans-serif}.kv-voice-primary{background:linear-gradient(110deg,#754ce0,#157d9b);border-color:#786ce0;color:#fff}.kv-voice-danger{border-color:#74394c;background:#321725;color:#ffdce6}.kv-voice-btn:disabled{opacity:.45;cursor:not-allowed}
      .kv-voice-transcript{display:flex;flex-direction:column;gap:8px;min-height:72px;max-height:24vh;overflow:auto;padding:12px;margin-top:14px;background:#070b17;border:1px solid #283251;border-radius:14px}.kv-voice-empty{color:#727e9f;font-size:12px;line-height:1.6;text-align:center;margin:auto;padding:14px}.kv-voice-line{max-width:92%;padding:10px 12px;border:1px solid #293556;background:#111a30;border-radius:13px;font-size:13px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}.kv-voice-line.user{align-self:flex-end;background:#242044;border-color:#433b73;border-radius:13px 4px 13px 13px}.kv-voice-line.assistant{align-self:flex-start;background:#102333;border-color:#25465b;border-radius:4px 13px 13px 13px}
      .kv-voice-error{color:#ffb5c2;font-size:12px;line-height:1.5;margin-top:10px;overflow-wrap:anywhere}.kv-voice-privacy{padding:10px 12px;border-radius:12px;background:#11182a;border:1px solid #29324d;color:#99a5c6;font-size:11px;line-height:1.6;margin-top:12px}
      @media(max-width:520px){.kv-voice-dialog{border-radius:18px}.kv-voice-title{font-size:20px}.kv-voice-orb{width:88px;height:88px;border-radius:28px;font-size:36px}}
    `;
    document.head.append(style);

    const openBtn = document.createElement("button");
    openBtn.type = "button"; openBtn.className = "mode-btn voice"; openBtn.textContent = "🎙️ Canlı ses"; openBtn.setAttribute("aria-haspopup", "dialog");
    modeRow.insertBefore(openBtn, modeNote);

    const modal = document.createElement("div"); modal.className = "kv-voice-backdrop"; modal.hidden = true;
    modal.innerHTML = `
      <section class="kv-voice-dialog" role="dialog" aria-modal="true" aria-labelledby="kvVoiceTitle">
        <div class="kv-voice-head"><div><h2 class="kv-voice-title" id="kvVoiceTitle">Kıvıl Canlı Ses</h2><p class="kv-voice-sub">Sen konuş, Kıvıl dinlesin ve sesli cevap versin. İstediğin zaman araya girebilirsin.</p></div><button class="kv-voice-close" type="button" data-close aria-label="Kapat">✕</button></div>
        <div class="kv-voice-center"><div class="kv-voice-orb" data-orb aria-hidden="true">✦</div><div class="kv-voice-state" data-state>Görüşmeye hazır</div><div class="kv-voice-detail" data-detail>Mikrofon yalnızca başlattığında açılır.</div></div>
        <div class="kv-voice-buttons"><button class="kv-voice-btn kv-voice-primary" data-start type="button">🎙️ Görüşmeyi başlat</button><button class="kv-voice-btn" data-interrupt type="button" disabled>⏸ Araya gir</button><button class="kv-voice-btn kv-voice-danger" data-stop type="button" disabled>■ Görüşmeyi bitir</button></div>
        <div class="kv-voice-transcript" data-transcript aria-live="polite"><div class="kv-voice-empty" data-empty>Görüşme başlayınca konuşmalar burada görünür.</div></div><div class="kv-voice-error" data-error hidden></div>
        <div class="kv-voice-privacy">Bu sürüm Groq'u cevap üretmek ve gerektiğinde sesi yazıya çevirmek için kullanır. Türkçe seslendirme cihazının tarayıcı sesini kullanır; ses seçenekleri telefona göre değişebilir. Mikrofonu görüşmeyi bitirerek kapatabilirsin. Groq kullanım limitleri geçerli olabilir.</div>
      </section>`;
    document.body.append(modal);

    const stateEl = modal.querySelector("[data-state]"), detailEl = modal.querySelector("[data-detail]"), orb = modal.querySelector("[data-orb]");
    const startBtn = modal.querySelector("[data-start]"), interruptBtn = modal.querySelector("[data-interrupt]"), stopBtn = modal.querySelector("[data-stop]");
    const transcriptEl = modal.querySelector("[data-transcript]"), errorEl = modal.querySelector("[data-error]"), emptyEl = modal.querySelector("[data-empty]");
    const closeButtons = modal.querySelectorAll("[data-close]");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null, active = false, speaking = false, processing = false, restartTimer = null, requestId = 0;
    let history = [], lastHandled = "", lastHandledAt = 0, preferredVoice = null;

    function setState(title, detail, mood) {
      stateEl.textContent = title; detailEl.textContent = detail || ""; orb.classList.remove("listening", "speaking");
      if (mood) orb.classList.add(mood);
    }
    function showError(message) { errorEl.hidden = false; errorEl.textContent = message || "Bilinmeyen bir hata oluştu."; }
    function clearError() { errorEl.hidden = true; errorEl.textContent = ""; }
    function bubble(role, text) {
      if (emptyEl && emptyEl.isConnected) emptyEl.remove();
      const node = document.createElement("div"); node.className = "kv-voice-line " + role; node.textContent = text || ""; transcriptEl.append(node); transcriptEl.scrollTop = transcriptEl.scrollHeight; return node;
    }
    function chooseTurkishVoice() {
      if (!("speechSynthesis" in window)) return null;
      const voices = window.speechSynthesis.getVoices() || [];
      return voices.find(v => /^tr([-_]|$)/i.test(v.lang) && /natural|online|premium|google|microsoft/i.test(v.name)) || voices.find(v => /^tr([-_]|$)/i.test(v.lang)) || null;
    }
    function speak(text, id) {
      if (!active || id !== requestId || !text) return;
      if (!("speechSynthesis" in window)) { setState("Yanıt hazır", "Bu tarayıcıda seslendirme bulunmuyor."); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, "Kod bloğu.").replace(/https?:\/\/\S+/g, "bağlantı").slice(0, 3500));
      preferredVoice = chooseTurkishVoice(); if (preferredVoice) utterance.voice = preferredVoice;
      utterance.lang = preferredVoice?.lang || "tr-TR"; utterance.rate = 1.02; utterance.pitch = 1.0; utterance.volume = 1;
      utterance.onstart = () => { if (id !== requestId) return; speaking = true; interruptBtn.disabled = false; setState("Kıvıl konuşuyor", "İstersen ‘Araya gir’ düğmesine bas.", "speaking"); };
      utterance.onend = () => { if (id !== requestId) return; speaking = false; interruptBtn.disabled = true; if (active) startListening(); };
      utterance.onerror = () => { if (id !== requestId) return; speaking = false; interruptBtn.disabled = true; if (active) startListening(); };
      window.speechSynthesis.speak(utterance);
    }
    function startListening() {
      if (!active || speaking || processing || !recognition) return;
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (!active || speaking || processing) return;
        try { recognition.start(); setState("Seni dinliyorum", "Konuşmaya başlayabilirsin.", "listening"); }
        catch (e) { if (e.name !== "InvalidStateError") showError("Mikrofon başlatılamadı: " + e.message); }
      }, 250);
    }
    async function askGroq(text) {
      const clean = String(text || "").trim(); if (!clean || !active || processing) return;
      const now = Date.now(); if (clean === lastHandled && now - lastHandledAt < 2500) return;
      lastHandled = clean; lastHandledAt = now; processing = true; const id = ++requestId;
      if (recognition) { try { recognition.stop(); } catch {} }
      history.push({ role: "user", content: clean }); history = history.slice(-18);
      bubble("user", clean); setState("Kıvıl düşünüyor", "Groq üzerinden yanıt hazırlanıyor…");
      try {
        const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Sohbet servisi hata verdi (" + response.status + ").");
        const reply = String(data.reply || "").trim(); if (!reply) throw new Error("Kıvıl boş yanıt verdi.");
        history.push({ role: "assistant", content: reply }); history = history.slice(-18);
        bubble("assistant", reply);
        processing = false; speak(reply, id);
      } catch (error) {
        processing = false; showError(error.message || "Yanıt alınamadı."); setState("Yanıt alınamadı", "İnternet bağlantını veya Groq limitini kontrol et."); if (active) startListening();
      }
    }
    function makeRecognition() {
      if (!SpeechRecognition) return null;
      const rec = new SpeechRecognition(); rec.lang = "tr-TR"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
      let finalText = "", debounce = null;
      rec.onresult = event => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) finalText += " " + part; else interim += part;
        }
        if (interim && !processing && !speaking) { setState("Seni dinliyorum", interim.slice(0, 120), "listening"); }
        if (finalText.trim()) {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(() => { const sentence = finalText.trim(); finalText = ""; if (sentence && active) askGroq(sentence); }, 700);
        }
      };
      rec.onerror = event => {
        if (!active) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") { showError("Mikrofon izni kapalı. Tarayıcı ayarlarından mikrofona izin ver."); setState("Mikrofon izni gerekli", "Site izinlerini kontrol et."); stopCall(false); }
        else if (event.error !== "no-speech" && event.error !== "aborted") showError("Ses tanıma: " + event.error + ". Chrome'da tekrar dene.");
      };
      rec.onend = () => { if (active && !speaking && !processing) startListening(); };
      return rec;
    }
    function startCall() {
      clearError();
      if (!SpeechRecognition) { showError("Bu tarayıcı canlı konuşma tanımayı desteklemiyor. Android'de Chrome kullanıp tekrar dene."); return; }
      if (!window.isSecureContext) { showError("Mikrofon için HTTPS bağlantısı gerekli."); return; }
      active = true; processing = false; speaking = false; history = []; startBtn.disabled = true; stopBtn.disabled = false; interruptBtn.disabled = true;
      recognition = makeRecognition();
      setState("Mikrofon açılıyor…", "Tarayıcı mikrofon izni isteyebilir."); startListening();
    }
    function interrupt() {
      if (!active) return;
      requestId++; speaking = false; processing = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (recognition) { try { recognition.stop(); } catch {} }
      interruptBtn.disabled = true; setState("Seni dinliyorum", "Söz sende. Konuşmaya devam et.", "listening"); startListening();
    }
    function stopCall(updateStatus = true) {
      active = false; processing = false; speaking = false; requestId++;
      if (restartTimer) clearTimeout(restartTimer); restartTimer = null;
      if (recognition) { recognition.onend = null; try { recognition.stop(); } catch {} } recognition = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      startBtn.disabled = false; stopBtn.disabled = true; interruptBtn.disabled = true;
      orb.classList.remove("listening", "speaking"); if (updateStatus) setState("Görüşme sona erdi", "Mikrofon ve seslendirme durduruldu.");
    }
    function openModal() { modal.hidden = false; clearError(); startBtn.focus(); }
    function closeModal() { stopCall(); modal.hidden = true; }
    openBtn.addEventListener("click", openModal); startBtn.addEventListener("click", startCall); stopBtn.addEventListener("click", () => stopCall()); interruptBtn.addEventListener("click", interrupt);
    closeButtons.forEach(button => button.addEventListener("click", closeModal)); modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); }); window.addEventListener("pagehide", () => stopCall(false));
    if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = () => { preferredVoice = chooseTurkishVoice(); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
