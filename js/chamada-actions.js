(function () {
  var selectedAmount = 150;
  var statusTimer = null;

  function hasText(element, text) {
    return (element.textContent || "").toLowerCase().indexOf(text.toLowerCase()) !== -1;
  }

  function go(url) {
    window.location.href = url;
  }

  function goResult() {
    var search = window.location.search || "";
    go("/consulta-sagrada-revelacao-amorosa-v9b2" + search);
  }

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function formatMoney(value) {
    return "R$ " + Number(value).toFixed(2).replace(".", ",");
  }

  function fetchWithFallback(primaryUrl, fallbackUrl, options) {
    return fetch(primaryUrl, options).then(function (response) {
      var contentType = response.headers.get("content-type") || "";
      if ((response.status === 404 || response.ok) && contentType.indexOf("application/json") === -1) {
        return fetch(fallbackUrl, options);
      }
      return response;
    });
  }

  function paymentStatusLabel(status) {
    var labels = {
      PENDING: "pendente",
      AUTHORIZED: "confirmado",
      FAILED: "falhou",
      CHARGEBACK: "em contestação",
      IN_DISPUTE: "em análise"
    };
    return labels[String(status || "PENDING").toUpperCase()] || String(status || "pendente").toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char];
    });
  }

  function qrUrl(payload) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(payload);
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}");
    } catch (error) {
      return {};
    }
  }

  function readTracking() {
    if (window.TemploTracking && window.TemploTracking.read) {
      return window.TemploTracking.read();
    }
    return {};
  }

  function trackCheckoutEvent(amount, productName) {
    if (window.TemploTracking && window.TemploTracking.trackInitiateCheckout) {
      window.TemploTracking.trackInitiateCheckout(amount, productName);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("utmify:checkout", {
        detail: {currency: "BRL", value: amount, product: productName}
      }));
    } catch (error) {}
    try {
      if (window.fbq) window.fbq("track", "InitiateCheckout", {currency: "BRL", value: amount, content_name: productName});
    } catch (error) {}
    try {
      if (window.ttq) window.ttq.track("InitiateCheckout", {currency: "BRL", value: amount, content_name: productName});
    } catch (error) {}
  }

  function openPayment() {
    closePayment();
    var state = readState();
    var overlay = document.createElement("div");
    overlay.id = "tdl-chamada-payment";
    overlay.className = "fixed inset-0 z-[260] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4";
    overlay.innerHTML =
      '<div class="fixed inset-0" data-close-payment></div>' +
      '<div class="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[32px] border border-amber-200/60 bg-white p-4 text-center shadow-2xl sm:max-w-[520px] sm:rounded-[32px] sm:p-6">' +
        '<button type="button" data-close-payment aria-label="Fechar" class="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600 hover:bg-stone-200">×</button>' +
        '<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-red-950">🕯️ Premium completo</span>' +
        '<h2 class="mt-3 font-display text-2xl font-black leading-tight text-[#2b0f0f]">Liberar tudo com Milena</h2>' +
        '<p class="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-stone-600">São 3 sessões por WhatsApp com leitura da mão por videochamada, cartas amorosas, oráculo de 90 dias, amarração de 3 a 7 dias e liberdade para escolher o foco de cada sessão.</p>' +
        '<div class="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-emerald-800">Tudo incluso</p><strong class="mt-1 block text-3xl font-black text-[#7f1d1d]">' + formatMoney(selectedAmount) + '</strong><span class="mt-1 block text-[10px] font-black uppercase tracking-wider text-emerald-800">3 sessões completas</span></div>' +
        '<div id="tdl-chamada-form" class="mt-4 space-y-2.5 text-left">' +
          '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">Seu nome <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-chamada-name" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
          '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">WhatsApp com DDD <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-chamada-phone" inputmode="tel" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" placeholder="(11) 99999-9999"></label>' +
          '<p id="tdl-chamada-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
        '</div>' +
        '<div id="tdl-chamada-result" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center"></div>' +
        '<button type="button" id="tdl-chamada-pix" class="utmify-initiate-checkout mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">Ver QR Code PIX</button>' +
        '<button type="button" id="tdl-chamada-skip" class="mt-3 w-full bg-transparent text-[12px] font-bold text-[#9a5a5a] underline decoration-[#f59e0b]/60 underline-offset-4">Agora não, voltar para o resultado ›</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-close-payment]").forEach(function (item) {
      item.addEventListener("click", closePayment);
    });
    overlay.querySelector("#tdl-chamada-skip").addEventListener("click", function () {
      goResult();
    });
    overlay.querySelector("#tdl-chamada-pix").addEventListener("click", createPix);
  }

  function closePayment() {
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = null;
    if (pixTimerInterval) clearInterval(pixTimerInterval);
    var overlay = document.getElementById("tdl-chamada-payment");
    if (overlay) overlay.remove();
  }

  function showError(message) {
    var box = document.getElementById("tdl-chamada-error");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function createPix() {
    var state = readState();
    var button = document.getElementById("tdl-chamada-pix");
    var name = (document.getElementById("tdl-chamada-name").value || state.nome || "").trim();
    var phone = digits(document.getElementById("tdl-chamada-phone").value);
    if (phone.length > 0 && phone.length < 10) {
      showError("Se quiser informar WhatsApp, coloque com DDD. Se não tiver, deixe em branco.");
      return;
    }
    var SUPABASE_PIX_CREATE_URL = "/api/create-pix";
    var SUPABASE_PIX_STATUS_URL = "/api/check-purchase";

    button.disabled = true;
    button.textContent = "Gerando PIX...";
    trackCheckoutEvent(selectedAmount, "Leitura Amorosa Premium - 3 sessões com videochamada");

    var pixPayload = {
      product_id: "premium_video_150",
      amount: selectedAmount,
      name: name,
      phone: phone,
      ente: state.ente || "",
      letter: "Reserva de chamada ao vivo com a taróloga Milena.",
      tracking: readTracking()
    };

    var requestOptions = {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(pixPayload)
    };
    fetchWithFallback(SUPABASE_PIX_CREATE_URL, "create-pix.php", requestOptions)
      .then(function (response) { return response.json().then(function (body) { return {ok: response.ok, body: body}; }); })
      .then(function (result) {
        if (!result.ok || !result.body.ok) throw new Error(result.body.error || "Não foi possível gerar o PIX.");
        renderPix(result.body);
        watchPayment(result.body);
      })
      .catch(function (error) {
        showError(error.message || "Não foi possível gerar o PIX agora.");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Ver QR Code PIX";
      });
  }

  var pixTimerInterval = null;

  function renderPix(pix) {
    var box = document.getElementById("tdl-chamada-result");
    if (!box) return;
    box.classList.remove("hidden");
    box.className = "mt-4 rounded-3xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 p-4 sm:p-5 text-center shadow-xl";

    var expiresSeconds = 15 * 60;
    if (pixTimerInterval) clearInterval(pixTimerInterval);

    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-emerald-100 pb-3">' +
        '<div class="flex items-center gap-2">' +
          '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-black">✓</span>' +
          '<div class="text-left">' +
            '<p class="text-[11px] font-black uppercase tracking-wider text-emerald-900">PIX Seguro Gerado</p>' +
            '<p class="text-[10px] text-stone-500">Banco Central • Aprovação Instantânea</p>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">' +
          '<span>⏳</span> <span id="tdl-chamada-countdown">15:00</span>' +
        '</div>' +
      '</div>' +

      '<div class="mt-4 mx-auto inline-block rounded-2xl border-2 border-emerald-400 bg-white p-3 shadow-md">' +
        '<img src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="210" height="210" class="block mx-auto rounded-lg">' +
        '<p class="mt-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Aponte a câmera do seu banco</p>' +
      '</div>' +

      '<button type="button" id="tdl-copy-chamada-pix" class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[13.5px] font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
        '<span id="tdl-chamada-copy-label">Copiar Código PIX Copia e Cola</span>' +
      '</button>' +

      '<textarea id="tdl-chamada-code" readonly onclick="this.select()" title="Toque para selecionar" class="mt-2.5 h-16 w-full rounded-xl border border-emerald-200 bg-white p-2.5 text-[10px] text-stone-600 outline-none focus:border-emerald-500 font-mono select-all">' + escapeHtml(pix.pix_payload) + '</textarea>' +

      '<div class="mt-4 rounded-2xl border border-stone-200 bg-stone-50/90 p-3.5 text-left text-[11.5px] text-stone-700 space-y-2">' +
        '<p class="font-black text-stone-900 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">' +
          '<span class="text-emerald-700 font-bold">●</span> Como pagar pelo seu celular:' +
        '</p>' +
        '<div class="flex items-start gap-2.5">' +
          '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">1</span>' +
          '<span>Toque no botão verde acima para <strong>Copiar o Código PIX</strong>.</span>' +
        '</div>' +
        '<div class="flex items-start gap-2.5">' +
          '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">2</span>' +
          '<span>Abra o app do seu banco e escolha a opção <strong>PIX Copia e Cola</strong>.</span>' +
        '</div>' +
        '<div class="flex items-start gap-2.5">' +
          '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">3</span>' +
          '<span>Cole o código, confirme o valor e volte aqui.</span>' +
        '</div>' +
      '</div>' +

      '<div class="mt-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-3.5 text-left">' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-base">⚠️</span>' +
          '<strong class="text-[11.5px] font-black text-amber-950 uppercase tracking-wide">Importante: Não feche esta tela!</strong>' +
        '</div>' +
        '<p class="mt-1 text-[11px] leading-relaxed text-amber-900">' +
          'Após o pagamento, o sistema reconhece em segundos e te encaminha para o agendamento da sua chamada com a taróloga.' +
        '</p>' +
      '</div>' +

      '<div id="tdl-chamada-status" class="mt-3.5 flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-100/70 p-3 text-[12px] font-bold text-emerald-950">' +
        '<span class="relative flex h-3 w-3">' +
          '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>' +
          '<span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>' +
        '</span>' +
        '<span id="tdl-chamada-status-text">Aguardando confirmação do banco...</span>' +
      '</div>';

    pixTimerInterval = setInterval(function () {
      expiresSeconds--;
      if (expiresSeconds <= 0) {
        clearInterval(pixTimerInterval);
        var cd = document.getElementById("tdl-chamada-countdown");
        if (cd) cd.textContent = "Expirado";
      } else {
        var m = Math.floor(expiresSeconds / 60);
        var s = expiresSeconds % 60;
        var cd = document.getElementById("tdl-chamada-countdown");
        if (cd) cd.textContent = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
      }
    }, 1000);

    var copyBtn = document.getElementById("tdl-copy-chamada-pix");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var code = document.getElementById("tdl-chamada-code");
        if (code) {
          code.select();
          code.setSelectionRange(0, 99999);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pix.pix_payload || code.value);
          } else {
            document.execCommand("copy");
          }
        }
        var label = document.getElementById("tdl-chamada-copy-label");
        if (label) label.textContent = "✓ CÓDIGO PIX COPIADO COM SUCESSO!";
        copyBtn.className = "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-[13.5px] font-black uppercase tracking-wider text-white shadow-xl ring-4 ring-emerald-300 transition-all duration-200 cursor-pointer";
        setTimeout(function () {
          if (label) label.textContent = "Copiar Código PIX Copia e Cola";
          copyBtn.className = "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[13.5px] font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer";
        }, 3000);
      });
    }

    box.scrollIntoView({behavior: "smooth", block: "center"});
  }

  function watchPayment(pix) {
    var SUPABASE_PIX_STATUS_URL = "/api/check-purchase";
    if (statusTimer) clearInterval(statusTimer);
    var polling = false;
    var attempts = 0;
    statusTimer = setInterval(function () {
      if (polling) return;
      if (++attempts > 300) {
        clearInterval(statusTimer);
        statusTimer = null;
        return;
      }
      polling = true;
      var query = "?external_id=" + encodeURIComponent(pix.external_id) + "&transaction_id=" + encodeURIComponent(pix.transaction_id);
      fetchWithFallback(SUPABASE_PIX_STATUS_URL + query, "check-purchase.php" + query)
        .then(function (response) { return response.json(); })
        .then(function (status) {
          var box = document.getElementById("tdl-chamada-status");
          var statusText = document.getElementById("tdl-chamada-status-text");
          if (!box) return;
          if (status.paid) {
            clearInterval(statusTimer);
            statusTimer = null;
            if (pixTimerInterval) clearInterval(pixTimerInterval);
            box.className = "mt-3.5 flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-500 p-3.5 text-[13px] font-black text-white shadow-lg";
            box.innerHTML = '<span>✓</span> <span>Pagamento confirmado! Encaminhando para o atendimento...</span>';
            setTimeout(function () { go("/confirmacao-atendimento-bencao-q39p?pedido=" + encodeURIComponent(pix.external_id)); }, 1500);
          } else {
            if (statusText) {
              statusText.textContent = "Aguardando confirmação do PIX... " + paymentStatusLabel(status.status);
            }
          }
        })
        .catch(function () {})
        .finally(function () { polling = false; });
    }, 3000);
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button, a, [role='button']");
    if (!target) return;

    if (hasText(target, "Agora não") || hasText(target, "continuar com minha carta")) {
      event.preventDefault();
      goResult();
      return;
    }

    if (hasText(target, "Quero reservar minha chamada")) {
      event.preventDefault();
      openPayment();
    }
  }, true);
})();
