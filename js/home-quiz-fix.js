(function () {
  var isNavigating = false;

  function injectMotionStyles() {
    if (document.getElementById("tdl-motion-styles")) return;
    var style = document.createElement("style");
    style.id = "tdl-motion-styles";
    style.textContent = `
      @keyframes tdlSlideIn {
        from {
          opacity: 0;
          transform: translateX(28px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      @keyframes tdlSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-24px);
        }
      }
      @keyframes tdlPop {
        0% { transform: scale(0.85); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes tdlGlow {
        0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
        50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.45); }
      }
      @keyframes tdlTarotFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(1.5deg); }
      }
      @keyframes tdlMediumAura {
        0%, 100% {
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.4), 0 0 50px rgba(180, 83, 9, 0.35);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 45px rgba(245, 158, 11, 0.7), 0 0 75px rgba(220, 38, 38, 0.45);
          transform: scale(1.02);
        }
      }
      @keyframes tdlFloatGlow {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-5px);
        }
      }
      .tdl-motion-enter {
        animation: tdlSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .tdl-motion-exit {
        animation: tdlSlideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      .tdl-pop-check {
        animation: tdlPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .tdl-tarot-card {
        animation: tdlTarotFloat 3s ease-in-out infinite;
      }
      .tdl-medium-frame {
        animation: tdlMediumAura 3.5s ease-in-out infinite;
      }
      .tdl-float-glow {
        animation: tdlFloatGlow 3s ease-in-out infinite;
      }

      /* Efeito Ripple tátil ao clicar */
      .tdl-option-card {
        position: relative;
        overflow: hidden;
      }
      .tdl-ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: tdlRippleAnim 0.55s ease-out forwards;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(245, 158, 11, 0) 70%);
        pointer-events: none;
      }
      @keyframes tdlRippleAnim {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      /* Micro-partículas místicas cintilantes */
      .tdl-sparkle {
        position: fixed;
        pointer-events: none;
        font-size: 14px;
        line-height: 1;
        z-index: 9999;
        user-select: none;
        animation: tdlSparkleAnim 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
      @keyframes tdlSparkleAnim {
        0% {
          opacity: 1;
          transform: translate(0, 0) scale(0.6) rotate(0deg);
        }
        100% {
          opacity: 0;
          transform: translate(var(--tx), var(--ty)) scale(1.3) rotate(var(--rot));
        }
      }

      /* Cena 3D das Cartas de Tarot no Altar */
      .tdl-tarot-scene {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        perspective: 1000px;
        margin: 16px 0 18px 0;
      }
      .tdl-tarot-card-wrap {
        width: 90px;
        height: 132px;
        perspective: 1000px;
      }
      @media (min-width: 380px) {
        .tdl-tarot-card-wrap {
          width: 100px;
          height: 146px;
        }
      }
      .tdl-tarot-flipper {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.8s cubic-bezier(0.34, 1.35, 0.64, 1);
        transform-style: preserve-3d;
        border-radius: 12px;
        box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.25);
      }
      .tdl-tarot-flipper.flipped {
        transform: rotateY(180deg);
      }
      .tdl-tarot-front, .tdl-tarot-back {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        border-radius: 12px;
        overflow: hidden;
      }
      .tdl-tarot-back {
        background: linear-gradient(145deg, #2b0b0b 0%, #4a0d0d 50%, #1f0505 100%);
        border: 2px solid #f59e0b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6px;
        box-shadow: inset 0 0 10px rgba(245, 158, 11, 0.35);
      }
      .tdl-tarot-back-inner {
        border: 1px dashed rgba(245, 158, 11, 0.5);
        border-radius: 8px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
      }
      .tdl-tarot-front {
        transform: rotateY(180deg);
        border: 2px solid #f59e0b;
        background: #1c0606;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.45);
      }
      .tdl-tarot-front img {
        width: 100%;
        height: 72%;
        object-fit: cover;
        border-bottom: 1px solid rgba(245, 158, 11, 0.4);
      }
      .tdl-tarot-front-caption {
        height: 28%;
        background: linear-gradient(to top, #3b0a0a, #200505);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2px 3px;
      }
      .tdl-tarot-glow-reveal {
        animation: tdlCardGlowAnim 1.1s ease-out;
      }
      @keyframes tdlCardGlowAnim {
        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.85); }
        50% { box-shadow: 0 0 28px 6px rgba(245, 158, 11, 0.7); }
        100% { box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.25); }
      }

      /* Transição de Portal Místico de Saída */
      @keyframes tdlPortalTransition {
        0% { opacity: 1; transform: scale(1); filter: brightness(1); }
        50% { filter: brightness(1.2) drop-shadow(0 0 25px rgba(245, 158, 11, 0.65)); }
        100% { opacity: 0; transform: scale(1.02); filter: brightness(1.35); }
      }
      .tdl-portal-exit {
        animation: tdlPortalTransition 0.55s ease-in-out forwards !important;
      }
    `;
    document.head.appendChild(style);
  }

  function spawnSparkles(x, y) {
    var symbols = ["✦", "✧", "★", "✨", "❤️", "🔮"];
    var colors = ["#f59e0b", "#fbbf24", "#fcd34d", "#f43f5e", "#fb7185"];
    for (var i = 0; i < 7; i++) {
      var el = document.createElement("span");
      el.className = "tdl-sparkle";
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = x + "px";
      el.style.top = y + "px";
      var angle = Math.random() * Math.PI * 2;
      var dist = 28 + Math.random() * 52;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist;
      var rot = (Math.random() * 180 - 90) + "deg";
      el.style.setProperty("--tx", tx + "px");
      el.style.setProperty("--ty", ty + "px");
      el.style.setProperty("--rot", rot);
      document.body.appendChild(el);
      setTimeout(function (sparkle) {
        if (sparkle && sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
      }.bind(null, el), 720);
    }
  }

  function triggerRipple(event, button) {
    try {
      var rect = button.getBoundingClientRect();
      var circle = document.createElement("span");
      var diameter = Math.max(rect.width, rect.height);
      var radius = diameter / 2;
      circle.style.width = circle.style.height = diameter + "px";
      circle.style.left = (event.clientX - rect.left - radius) + "px";
      circle.style.top = (event.clientY - rect.top - radius) + "px";
      circle.classList.add("tdl-ripple");
      button.appendChild(circle);
      setTimeout(function () {
        if (circle && circle.parentNode) circle.parentNode.removeChild(circle);
      }, 600);
    } catch (e) {
      // Ripple fallback
    }
  }

  function getSessionId() {
    try {
      var sid = localStorage.getItem("tdl_quiz_session_id");
      if (!sid) {
        sid = "quiz_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("tdl_quiz_session_id", sid);
      }
      return sid;
    } catch (e) {
      return "quiz_" + Date.now();
    }
  }

  function saveLeadToSupabase() {
    try {
      var current = state();
      var urlParams = new URLSearchParams(window.location.search);
      var sid = getSessionId();

      var payload = {
        session_id: sid,
        nome: current.nome || "",
        ente: current.ente || "",
        relacao: current.relacao || "",
        intencao: current.intencao || "",
        utm_source: urlParams.get("utm_source") || "",
        utm_medium: urlParams.get("utm_medium") || "",
        utm_campaign: urlParams.get("utm_campaign") || "",
        utm_content: urlParams.get("utm_content") || "",
        utm_term: urlParams.get("utm_term") || "",
        referrer: document.referrer || ""
      };

      fetch("/api/save-quiz-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      }).then(function (result) {
        if (!result.saved) throw new Error("Lead nao salvo");
      }).catch(function (err) {
        console.warn("[TDL Quiz] Aviso ao salvar lead:", err);
      });
    } catch (err) {
      // Ignora erro para não interferir na experiência do usuário
    }
  }

  function getNameInput() {
    return document.getElementById("user-full-name") ||
      document.querySelector('input[aria-label="Como podemos chamar você? (Seu nome)"]') ||
      document.querySelector('input[placeholder="Digite seu nome completo"]') ||
      document.querySelector('input[placeholder*="nome" i]') ||
      document.querySelector('input[type="text"]');
  }


  function state() {
    try {
      return JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}");
    } catch (error) {
      return {};
    }
  }

  function setState(next) {
    var current = state();
    Object.keys(next).forEach(function (key) {
      current[key] = next[key];
    });
    try {
      localStorage.setItem("templodeluz_quiz_state", JSON.stringify(current));
    } catch (error) {
      // Storage cheio ou desabilitado no navegador
    }
  }

  function saveName(name) {
    setState({ nome: name });
  }

  function firstName(value, fallback) {
    var name = (value || "").trim();
    if (!name || name.length < 2) return fallback;
    return name.split(/\s+/)[0];
  }

  var SLUG_RESULTADO = "consulta-sagrada-revelacao-amorosa-v9b2";

  function goResult() {
    var search = window.location.search || "";
    window.location.href = "/" + SLUG_RESULTADO + search;
  }

  function footer() {
    return '<footer class="mt-10 border-t border-[#fee2e2] bg-[#f5effa] px-6 py-9 text-center text-[12px] leading-relaxed text-[#9a5a5a] font-normal"><div class="font-display text-base text-[#7f1d1d] font-bold tracking-tight">🕊️ Templo da Luz Amorosa</div><p class="mt-2.5 max-w-[360px] mx-auto text-[#8a4a4a] leading-relaxed">Templo da Luz Amorosa é um projeto de atendimento espiritual privado.</p><div class="mt-2 text-[11.5px] text-[#8a4a4a] font-medium space-y-0.5"><p>CNPJ 61.566.220/0001-71</p><p>Rua José Gonçalves Gomide, 144 — Vila Guilherme, São Paulo/SP — CEP 02075-001</p></div><div class="mx-auto my-4 h-px w-20 bg-[#fecaca]"></div><p class="text-[12px] text-[#8a4a4a]">Contato: <a class="font-semibold text-[#7f1d1d] hover:underline" href="mailto:tempodaluz@gmail.com">tempodaluz@gmail.com</a> · <a class="font-semibold text-[#7f1d1d] hover:underline" href="tel:+5519998316353">(19) 99831-6353</a></p><div class="mt-4 flex justify-center items-center gap-4 text-[12px] text-[#8a4a4a] font-medium"><a href="/politica-de-privacidade-sigilo-sagrado-p24" class="hover:text-[#7f1d1d] underline decoration-[#fecaca] underline-offset-4 transition-colors">Política de Privacidade</a><span>•</span><a href="/termos-de-uso-atendimento-espiritual-t18" class="hover:text-[#7f1d1d] underline decoration-[#fecaca] underline-offset-4 transition-colors">Termos de Uso</a></div><p class="mt-5 mx-auto max-w-[340px] text-[8.5px] leading-[1.4] text-[#b0a3b8] font-normal select-none">Este site não é parte, nem é endossado pelo Facebook, Instagram ou Meta Platforms, Inc. Todo o conteúdo aqui expresso é de inteira responsabilidade do Templo da Luz Amorosa. O Facebook e o Instagram são marcas registradas da Meta Platforms, Inc.</p></footer>';
  }

  function renderShell(cfg) {
    var step = cfg.step;
    var total = cfg.total;
    var eyebrow = cfg.eyebrow;
    var title = cfg.title;
    var subtitle = cfg.subtitle;
    var note = cfg.note;
    var bodyHtml = cfg.bodyHtml;
    var backStep = cfg.backStep;
    var percent = Math.max(1, Math.min(100, (step / total) * 100));
    var backBtn = backStep
      ? '<button type="button" data-tdl-back="' + backStep + '" aria-label="Voltar" class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#fecaca] bg-[#f9f6fc] text-base font-black text-[#7f1d1d] transition-colors hover:bg-[#f0e8f7]">‹</button>'
      : '';

    var html =
      '<div class="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#fbf9f5] text-[#2b0f0f] shadow-2xl border-x border-[#fee2e2]">' +
        '<main class="flex flex-1 flex-col">' +
          '<div class="sticky top-0 z-30 border-b border-[#fee2e2] bg-white/95 px-4 pt-3.5 pb-3 backdrop-blur-md shadow-xs sm:px-6">' +
            '<div class="mb-2 flex items-center justify-between text-xs">' +
              '<div class="flex min-w-0 items-center gap-2">' +
                backBtn +
                '<span class="flex min-w-0 items-center gap-1.5 truncate font-bold text-[#7f1d1d]"><span class="h-2 w-2 shrink-0 rounded-full bg-[#f59e0b] animate-pulse"></span>Sua conexão espiritual</span>' +
              '</div>' +
              '<span class="font-bold px-2.5 py-0.5 rounded-full bg-[#fff1f2] text-[#7f1d1d] border border-[#fecaca] text-[11px]">Etapa ' + step + ' de ' + total + '</span>' +
            '</div>' +
            '<div class="h-2 overflow-hidden rounded-full bg-[#f0e8f7] border border-[#fee2e2] p-0.5">' +
              '<div class="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-sm transition-[width] duration-400 ease-out" style="width:' + percent + '%"></div>' +
            '</div>' +
            '<p class="mt-2 text-center text-[11px] font-semibold italic text-[#b45309]">✨ ' + (step < total ? 'A energia amorosa está guiando o caminho — continue' : 'Suas cartas já estão no altar sagrado') + '</p>' +
          '</div>' +
          '<div id="tdl-step-container" class="tdl-motion-enter">' +
            '<div class="px-4 pt-7 pb-3 sm:px-6">' +
              '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[11px] font-bold tracking-[0.14em] text-[#92400e] uppercase mb-3 shadow-2xs">' + eyebrow + '</span>' +
              '<h2 class="font-display text-[24px] sm:text-[25px] leading-[1.25] font-extrabold text-[#2b0f0f] tracking-tight">' + title + '</h2>' +
              '<p class="mt-2 text-[14px] sm:text-[14.5px] text-[#8a4a4a] leading-relaxed font-normal">' + subtitle + '</p>' +
            '</div>' +
            '<div class="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-[#fee2e2] bg-[#fff1f2] px-4 py-3 shadow-2xs sm:mx-6">' +
              '<span class="text-2xl shrink-0">' + note.icon + '</span>' +
              '<p class="text-[12.5px] sm:text-[13px] font-medium italic leading-relaxed text-[#8a4a4a]">' + note.text + '</p>' +
            '</div>' +
            bodyHtml +
          '</div>' +
        '</main>' +
        footer() +
      '</div>';

    document.body.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });

    var back = document.querySelector("[data-tdl-back]");
    if (back) {
      back.addEventListener("click", function () {
        navigateToStep(back.dataset.tdlBack);
      });
    }
  }

  function motionOption(label, hint, emoji, nextStep, key, value) {
    return (
      '<button type="button" data-tdl-choice="true" data-next="' + nextStep + '" data-key="' + key + '" data-value="' + value.replaceAll('"', "&quot;") + '" class="tdl-option-card group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-4 text-left transition-all duration-200 sm:gap-4 sm:px-4 border-[#fee2e2] bg-white hover:border-[#f59e0b] hover:bg-[#fffdf9] hover:scale-[1.01] active:scale-[0.985] shadow-xs">' +
        '<div class="tdl-option-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff1f2] border border-[#fee2e2] text-2xl group-hover:scale-110 transition-transform">' + emoji + '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<span class="block text-[15px] sm:text-[15.5px] font-bold text-[#2b0f0f] leading-snug">' + label + '</span>' +
          '<span class="mt-0.5 block text-[12px] sm:text-[12.5px] text-[#9a5a5a] leading-normal font-normal">' + hint + '</span>' +
        '</div>' +
        '<div class="tdl-option-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black transition-all duration-200 border-[#fecaca] text-transparent group-hover:border-[#f59e0b]">✓</div>' +
      '</button>'
    );
  }

  function advanceToNextStep(next) {
    var container = document.getElementById("tdl-step-container");
    if (container) {
      container.classList.remove("tdl-motion-enter");
      container.classList.add("tdl-motion-exit");
    }
    setTimeout(function () {
      isNavigating = false;
      navigateToStep(next);
    }, 180);
  }

  function handleChoiceClick(event) {
    event.preventDefault();
    if (isNavigating) return;
    isNavigating = true;

    var button = event.currentTarget;
    triggerRipple(event, button);
    if (event.clientX && event.clientY) {
      spawnSparkles(event.clientX, event.clientY);
    }

    button.classList.remove("border-[#fee2e2]", "bg-white");
    button.classList.add("border-emerald-500", "bg-emerald-50/70", "shadow-md", "scale-[1.015]");

    var icon = button.querySelector(".tdl-option-icon");
    if (icon) {
      icon.classList.add("bg-emerald-100", "border-emerald-300");
    }

    var check = button.querySelector(".tdl-option-check");
    if (check) {
      check.className = "tdl-option-check tdl-pop-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black border-emerald-600 bg-emerald-600 text-white shadow-xs";
    }

    var key = button.dataset.key;
    var value = button.dataset.value;
    var next = button.dataset.next;

    var payload = {};
    payload[key] = value;
    setState(payload);

    setTimeout(function () {
      advanceToNextStep(next);
    }, 220);
  }

  function wireChoiceButtons() {
    document.querySelectorAll("[data-tdl-choice='true']").forEach(function (button) {
      button.addEventListener("click", handleChoiceClick);
    });
  }

  function setStepComplete(stepEl, iconEl) {
    if (!stepEl) return;
    stepEl.className = "flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-50/80 px-3.5 py-2.5 text-emerald-950 shadow-2xs transition-all duration-300";
    if (iconEl) {
      iconEl.className = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white";
      iconEl.textContent = "✓";
    }
  }

  function renderLoading() {
    saveLeadToSupabase();
    var data = state();
    var nome = firstName(data.nome, "Você");
    var ente = firstName(data.ente, "Pessoa Amada");

    // Mantém a paleta natural do quiz sem troca brusca para fundo escuro
    document.documentElement.style.background = "";
    document.documentElement.style.backgroundColor = "";
    document.documentElement.style.colorScheme = "";
    document.body.style.background = "";
    document.body.style.backgroundColor = "";

    var html =
      '<div id="tdl-loading-screen" class="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#fbf9f5] text-[#2b0f0f] shadow-2xl border-x border-[#fee2e2] transition-all duration-500">' +
        // Header sticky no formato idêntico ao do Quiz
        '<div class="sticky top-0 z-30 border-b border-[#fee2e2] bg-white/95 px-4 pt-3.5 pb-3 backdrop-blur-md shadow-xs sm:px-6">' +
          '<div class="mb-2 flex items-center justify-between text-xs">' +
            '<div class="flex min-w-0 items-center gap-2">' +
              '<span class="flex min-w-0 items-center gap-1.5 truncate font-bold text-[#7f1d1d]">' +
                '<span class="h-2 w-2 shrink-0 rounded-full bg-[#f59e0b] animate-pulse"></span>' +
                'Sua conexão espiritual' +
              '</span>' +
            '</div>' +
            '<span class="font-bold px-2.5 py-0.5 rounded-full bg-[#fff1f2] text-[#7f1d1d] border border-[#fecaca] text-[11px]">' +
              'Etapa 4 de 4' +
            '</span>' +
          '</div>' +
          '<div class="h-2 overflow-hidden rounded-full bg-[#f0e8f7] border border-[#fee2e2] p-0.5">' +
            '<div id="tdl-loading-top-bar" class="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-sm transition-all duration-300" style="width:15%"></div>' +
          '</div>' +
          '<p class="mt-2 text-center text-[11px] font-semibold italic text-[#b45309]">' +
            '✨ A energia amorosa está guiando a abertura no altar...' +
          '</p>' +
        '</div>' +

        '<main class="flex flex-1 flex-col px-4 pt-5 pb-8 sm:px-6">' +
          // Cabeçalho da etapa
          '<div class="text-center">' +
            '<span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[11px] font-bold tracking-[0.14em] text-[#92400e] uppercase mb-2.5 shadow-2xs">' +
              '✦ ALTAR SAGRADO DE TAROT ✦' +
            '</span>' +
            '<h1 class="font-display text-[23px] sm:text-[25px] leading-[1.25] font-extrabold text-[#2b0f0f] tracking-tight">' +
              'Milena está abrindo as cartas' +
            '</h1>' +
            '<p class="mt-1.5 text-[13.5px] sm:text-[14px] text-[#8a4a4a] leading-relaxed font-normal max-w-sm mx-auto">' +
              'Sintonizando o campo espiritual entre <strong class="text-[#7f1d1d] font-bold">' + nome + '</strong> e <strong class="text-[#7f1d1d] font-bold">' + ente + '</strong>...' +
            '</p>' +
          '</div>' +

          // Foto da Médium Milena destacada em moldura sagrada
          '<div class="my-3.5 flex flex-col items-center justify-center">' +
            '<div class="relative flex flex-col items-center">' +
              '<div class="relative h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-3xl border-2 border-amber-400/80 shadow-md bg-amber-50 ring-4 ring-amber-400/20">' +
                '<img src="images/medium-milena.webp" alt="Taróloga Milena Medeiros" class="h-full w-full object-cover object-top" onerror="this.src=\'images/medium-milena.jpeg\'" />' +
                '<span class="absolute bottom-2 right-2 flex h-3.5 w-3.5">' +
                  '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>' +
                  '<span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>' +
                '</span>' +
              '</div>' +
              '<div class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3 py-0.5 text-[10.5px] font-bold text-[#92400e] shadow-2xs">' +
                'Taróloga Milena Medeiros · No Altar' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Altar das 3 Cartas Sagradas de Tarot em 3D Flip
          '<div class="my-2">' +
            '<p class="text-center text-[11px] font-bold text-[#b45309] uppercase tracking-wider mb-1">' +
              '🔮 3 Arcanos Revelados no Altar 🔮' +
            '</p>' +
            '<div class="tdl-tarot-scene">' +
              // Carta 1: Sentimentos
              '<div class="tdl-tarot-card-wrap">' +
                '<div id="tdl-card-1" class="tdl-tarot-flipper">' +
                  '<div class="tdl-tarot-back">' +
                    '<div class="tdl-tarot-back-inner">' +
                      '<span class="text-amber-400 text-lg font-serif">✦</span>' +
                      '<span class="text-[8.5px] font-bold text-amber-300 uppercase tracking-widest mt-1">Arcano I</span>' +
                      '<span class="text-[7.5px] text-amber-200/80 mt-0.5">Segredo</span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="tdl-tarot-front">' +
                    '<img src="images/conexao_almas.webp" alt="Sentimentos Ocultos" onerror="this.src=\'images/cartas inicio.webp\'"/>' +
                    '<div class="tdl-tarot-front-caption">' +
                      '<span class="text-[8px] font-black uppercase text-amber-300 tracking-wide">Sentimentos</span>' +
                      '<span class="text-[7px] text-zinc-300 leading-tight">Ocultos</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // Carta 2: Terceira Pessoa / Bloqueios
              '<div class="tdl-tarot-card-wrap">' +
                '<div id="tdl-card-2" class="tdl-tarot-flipper">' +
                  '<div class="tdl-tarot-back">' +
                    '<div class="tdl-tarot-back-inner">' +
                      '<span class="text-amber-400 text-lg font-serif">✦</span>' +
                      '<span class="text-[8.5px] font-bold text-amber-300 uppercase tracking-widest mt-1">Arcano II</span>' +
                      '<span class="text-[7.5px] text-amber-200/80 mt-0.5">Caminho</span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="tdl-tarot-front">' +
                    '<img src="images/terceira_pessoa.webp" alt="Bloqueios e Afastamento" onerror="this.src=\'images/nao_dito.webp\'"/>' +
                    '<div class="tdl-tarot-front-caption">' +
                      '<span class="text-[8px] font-black uppercase text-amber-300 tracking-wide">Bloqueios</span>' +
                      '<span class="text-[7px] text-zinc-300 leading-tight">O Não Dito</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // Carta 3: Destino 90 Dias & Volta
              '<div class="tdl-tarot-card-wrap">' +
                '<div id="tdl-card-3" class="tdl-tarot-flipper">' +
                  '<div class="tdl-tarot-back">' +
                    '<div class="tdl-tarot-back-inner">' +
                      '<span class="text-amber-400 text-lg font-serif">✦</span>' +
                      '<span class="text-[8.5px] font-bold text-amber-300 uppercase tracking-widest mt-1">Arcano III</span>' +
                      '<span class="text-[7.5px] text-amber-200/80 mt-0.5">Destino</span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="tdl-tarot-front">' +
                    '<img src="images/previsao_90_dias.webp" alt="Destino e Volta" onerror="this.src=\'images/escolha de cartas.webp\'"/>' +
                    '<div class="tdl-tarot-front-caption">' +
                      '<span class="text-[8px] font-black uppercase text-amber-300 tracking-wide">Destino</span>' +
                      '<span class="text-[7px] text-zinc-300 leading-tight">Previsão 90d</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Card de status e etapas
          '<div class="w-full rounded-2xl border border-[#fee2e2] bg-white p-4 sm:p-5 shadow-xs">' +
            '<div class="flex items-center justify-between text-[12px] font-bold text-[#7f1d1d] mb-2">' +
              '<span id="tdl-loading-status" class="flex items-center gap-2">' +
                '<span class="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse"></span>' +
                'Conectando energia amorosa...' +
              '</span>' +
              '<span id="tdl-loading-percent" class="font-black text-[#b45309] tabular-nums text-sm">15%</span>' +
            '</div>' +

            // Barra interna com gradiente dourado
            '<div class="h-2.5 overflow-hidden rounded-full bg-[#f0e8f7] border border-[#fee2e2] p-0.5 mb-4">' +
              '<div id="tdl-loading-bar" class="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] transition-all duration-300" style="width:15%"></div>' +
            '</div>' +

            // As 3 Etapas em cards limpos
            '<div class="space-y-2 text-left text-[12.5px] font-semibold">' +
              '<div id="tdl-step-1" class="flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-50/80 px-3.5 py-2.5 text-emerald-950 shadow-2xs transition-all duration-300">' +
                '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">✓</span>' +
                '<span class="leading-tight text-emerald-950">Abertura do campo amoroso</span>' +
              '</div>' +
              '<div id="tdl-step-2" class="flex items-center gap-3 rounded-xl border border-[#fee2e2] bg-[#fdfbf7] px-3.5 py-2.5 text-[#8a4a4a] transition-all duration-300">' +
                '<span id="tdl-icon-2" class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0e8f7] text-[10px] font-bold text-[#7f1d1d]">2</span>' +
                '<span class="leading-tight">Verificando sentimentos e caminhos</span>' +
              '</div>' +
              '<div id="tdl-step-3" class="flex items-center gap-3 rounded-xl border border-[#fee2e2] bg-[#fdfbf7] px-3.5 py-2.5 text-[#8a4a4a] transition-all duration-300">' +
                '<span id="tdl-icon-3" class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0e8f7] text-[10px] font-bold text-[#7f1d1d]">3</span>' +
                '<span class="leading-tight">Preparando leitura e revelação das cartas</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Rodapé de segurança e sigilo espiritual
          '<div class="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-[#8a4a4a]">' +
            '<span>🔒</span>' +
            '<span>Consulta privada e sigilo espiritual 100% protegido</span>' +
          '</div>' +
        '</main>' +
        footer() +
      '</div>';

    document.body.innerHTML = html;

    var bar = document.getElementById("tdl-loading-bar");
    var topBar = document.getElementById("tdl-loading-top-bar");
    var percent = document.getElementById("tdl-loading-percent");
    var status = document.getElementById("tdl-loading-status");
    var step2 = document.getElementById("tdl-step-2");
    var step3 = document.getElementById("tdl-step-3");
    var icon2 = document.getElementById("tdl-icon-2");
    var icon3 = document.getElementById("tdl-icon-3");
    var card1 = document.getElementById("tdl-card-1");
    var card2 = document.getElementById("tdl-card-2");
    var card3 = document.getElementById("tdl-card-3");

    var progress = 15;
    var timer = setInterval(function () {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
      }

      if (bar) bar.style.width = progress + "%";
      if (topBar) topBar.style.width = progress + "%";
      if (percent) percent.textContent = progress + "%";

      // Revela Carta 1: Sentimentos
      if (progress >= 35 && card1 && !card1.classList.contains("flipped")) {
        card1.classList.add("flipped", "tdl-tarot-glow-reveal");
      }

      // Etapa 2 completa
      if (progress >= 50 && step2) {
        setStepComplete(step2, icon2);
        if (status) {
          status.innerHTML = '<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Sintonizando sentimentos e caminhos...';
        }
      }

      // Revela Carta 2: Bloqueios
      if (progress >= 65 && card2 && !card2.classList.contains("flipped")) {
        card2.classList.add("flipped", "tdl-tarot-glow-reveal");
      }

      // Etapa 3 completa
      if (progress >= 85 && step3) {
        setStepComplete(step3, icon3);
        if (status) {
          status.innerHTML = '<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Revelando caminhos no altar...';
        }
      }

      // Revela Carta 3: Destino
      if (progress >= 90 && card3 && !card3.classList.contains("flipped")) {
        card3.classList.add("flipped", "tdl-tarot-glow-reveal");
      }

      if (progress >= 100) {
        if (status) {
          status.innerHTML = '<span class="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span> ✨ Suas cartas foram reveladas no altar!';
        }
        var root = document.getElementById("tdl-loading-screen");
        if (root) {
          root.classList.add("tdl-portal-exit");
        }
        setTimeout(goResult, 550);
      }
    }, 240); // Transição fluida de ~2.2 segundos
  }

  function navigateToStep(stepName) {
    injectMotionStyles();
    try {
      history.pushState({ step: stepName }, "", window.location.pathname + "?step=" + encodeURIComponent(stepName));
    } catch (e) {
      // Histórico inacessível no contexto
    }

    var data = state();
    var nome = firstName(data.nome, "você");
    var bodyHtml = "";

    if (stepName === "ente") {
      bodyHtml =
        '<div class="px-5 pb-14 sm:px-6">' +
          '<div class="w-full">' +
            '<label class="mb-2 block text-[12px] font-bold tracking-[0.14em] text-[#7f1d1d] uppercase">Nome dele(a) ou como você o(a) conhece</label>' +
            '<input id="tdl-ente-input" type="text" placeholder="Digite o nome dele(a)" class="w-full rounded-2xl border-2 bg-white px-4 py-4 text-[16px] font-semibold text-[#2b0f0f] shadow-xs outline-none transition-all duration-200 placeholder:text-[#b87171] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 border-[#fecaca]" value="' + (data.ente || "") + '">' +
          '</div>' +
          '<div class="mt-5">' +
            '<button type="button" id="tdl-next-ente" class="animate-pulse-cta w-full cursor-pointer rounded-2xl px-6 py-[18px] text-[15.5px] font-extrabold tracking-[0.02em] uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-lg bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] text-white shadow-amber-500/25 border border-amber-400/50 hover:brightness-105">' +
              '<span class="flex items-center justify-center gap-2 drop-shadow-xs font-bold">💫 Conectar Intenção Amorosa</span>' +
            '</button>' +
          '</div>' +
          '<div class="mt-6 flex items-start gap-3.5 rounded-2xl border border-[#fde68a] bg-[#fefaf3] p-4 text-left shadow-2xs">' +
            '<span class="text-2xl shrink-0 p-1.5 bg-white rounded-xl border border-[#fde68a]">🕯️</span>' +
            '<div>' +
              '<strong class="block text-[13px] font-bold text-[#92400e]">Sigilo absoluto no Altar</strong>' +
              '<p class="text-[12px] text-[#6e5984] leading-relaxed mt-0.5 font-normal">A taróloga utiliza esse nome apenas para orientar a abertura das cartas e sintonizar a energia correta.</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      renderShell({
        step: 2,
        total: 4,
        eyebrow: "🔮 Pessoa Consultada",
        title: nome + ", qual é o nome da pessoa que você deseja consultar?",
        subtitle: "Escreva o nome ou apelido pelo qual você conhece essa pessoa para Milena direcionar a leitura.",
        note: { icon: "🔒", text: "Esse nome fica guardado em sigilo e orienta a revelação correta nas cartas." },
        bodyHtml: bodyHtml,
        backStep: "intro"
      });

      var input = document.getElementById("tdl-ente-input");
      if (input) {
        input.focus();
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("tdl-next-ente").click();
          }
        });
      }

      document.getElementById("tdl-next-ente").addEventListener("click", function (e) {
        var val = (document.getElementById("tdl-ente-input").value || "").trim();
        if (!val) {
          input.focus();
          return;
        }
        triggerRipple(e, this);
        if (e.clientX && e.clientY) {
          spawnSparkles(e.clientX, e.clientY);
        }
        setState({ ente: val });
        setTimeout(function () {
          navigateToStep("relacao");
        }, 150);
      });
      return;
    }

    if (stepName === "relacao") {
      bodyHtml =
        '<div class="flex flex-col gap-3 px-5 pb-14 sm:px-6">' +
          motionOption("Estamos afastados ou sem contato", "Existe distância, silêncio ou bloqueio entre vocês", "🌙", "intencao", "relacao", "Estamos afastados ou sem contato") +
          motionOption("Ainda conversamos, mas sinto frieza", "Há contato, mas você sente dúvida, demora ou afastamento", "💬", "intencao", "relacao", "Ainda conversamos mas está frio") +
          motionOption("Terminamos recentemente e quero voltar", "Você quer saber se existe caminho de reconciliação", "💔", "intencao", "relacao", "Terminamos e quero voltar") +
          motionOption("Desconfio de outra pessoa no caminho", "Quer saber se existe amante, rival ou interferência", "👁️", "intencao", "relacao", "Suspeita de terceira pessoa") +
          motionOption("Quero atrair e conquistar de vez", "Abrir caminhos para paixão, união e reconexão firme", "🔥", "intencao", "relacao", "Quero atrair e conquistar") +
        '</div>';

      renderShell({
        step: 3,
        total: 4,
        eyebrow: "💞 Situação Entre Vocês",
        title: "Qual opção mais se parece com o momento atual de vocês?",
        subtitle: "Toque na opção mais próxima. Isso ajuda Milena a abrir as cartas no ponto certo da sua dor.",
        note: { icon: "🔮", text: "Toque na opção que seu coração reconhecer para avançar automaticamente." },
        bodyHtml: bodyHtml,
        backStep: "ente"
      });

      wireChoiceButtons();
      return;
    }

    if (stepName === "intencao") {
      bodyHtml =
        '<div class="flex flex-col gap-3 px-5 pb-14 sm:px-6">' +
          motionOption("Descobrir se ele(a) ainda me ama de verdade", "Entender sentimentos escondidos, saudade ou frieza", "❤️", "loading", "intencao", "Descobrir se ainda me ama") +
          motionOption("Saber se nós vamos voltar a ficar juntos", "Ver possibilidade real de retorno e próximos movimentos", "🔁", "loading", "intencao", "Saber se vamos voltar") +
          motionOption("Descobrir se existe terceira pessoa no caminho", "Afastar rival, amante ou influências externas que atrapalham", "👁️", "loading", "intencao", "Confirmar terceira pessoa") +
          motionOption("Fazer amarração amorosa para nos unir", "Abrir o caminho para reconciliação, desejo e amor firme", "🕯️", "loading", "intencao", "Amarração amorosa e volta") +
        '</div>';

      renderShell({
        step: 4,
        total: 4,
        eyebrow: "💌 Objetivo da Consulta",
        title: "O que o seu coração mais precisa descobrir nas cartas hoje?",
        subtitle: "Essa intenção define o caminho exato que a taróloga Milena abrirá no altar agora.",
        note: { icon: "✨", text: "Ao selecionar sua intenção, o altar iniciará a abertura da sua leitura amorosa." },
        bodyHtml: bodyHtml,
        backStep: "relacao"
      });

      wireChoiceButtons();
      return;
    }

    if (stepName === "loading") {
      renderLoading();
      return;
    }

    if (stepName === "result") {
      goResult();
    }
  }

  function goToQuiz() {
    var input = getNameInput();
    var name = input ? (input.value || "").trim() : "";

    if (!name) {
      var saved = state().nome;
      if (saved) name = saved.trim();
    }

    if (!name) {
      if (input) {
        input.focus();
        input.style.borderColor = "#f59e0b";
        input.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.35)";
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    saveName(name);
    navigateToStep("ente");
  }

  // Expõe API global do Quiz para chamadas diretas de botões inline
  window.TDL_QUIZ = {
    navigateToStep: navigateToStep,
    goToQuiz: goToQuiz,
    state: state,
    setState: setState
  };

  function bindDirectTriggers() {
    var btn = document.getElementById("btn-revelar-leitura");
    if (btn) {
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        goToQuiz();
      });
      btn.addEventListener("touchend", function(e) {
        e.preventDefault();
        goToQuiz();
      });
    }

    var bottomBtn = document.getElementById("btn-iniciar-leitura-bottom");
    if (bottomBtn) {
      bottomBtn.addEventListener("click", function(e) {
        e.preventDefault();
        var input = getNameInput();
        if (input && (input.value || "").trim()) {
          goToQuiz();
        } else if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    var input = getNameInput();
    if (input) {
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          goToQuiz();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDirectTriggers);
  } else {
    bindDirectTriggers();
  }

  // Monitora botão Voltar do navegador para navegar suavemente sem reload
  window.addEventListener("popstate", function (event) {
    var step = new URLSearchParams(window.location.search).get("step");
    if (step && step !== "intro") {
      navigateToStep(step);
    } else {
      window.location.href = window.location.pathname;
    }
  });

  // Intercepta cliques de início do Quiz na Home como garantia adicional
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;

    var text = (button.textContent || "").trim().toLowerCase();

    if (
      text.includes("revelar minha leitura") ||
      text.includes("revelar minha carta") ||
      text.includes("revelar minha leitura amorosa") ||
      text.includes("iniciar leitura de tarot")
    ) {
      event.preventDefault();
      event.stopPropagation();
      goToQuiz();
    }
  }, true);

  // Se já carregar com ?step=... na URL, renderiza diretamente
  var initialStep = new URLSearchParams(window.location.search).get("step");
  if (initialStep && initialStep !== "intro") {
    navigateToStep(initialStep);
  } else {
    injectMotionStyles();
  }
})();
