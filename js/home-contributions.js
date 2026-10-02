(function () {
  var selectedAmount = 35;
  var statusTimer = null;

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char];
    });
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

  function productIdForAmount(amount) {
    return [15, 25, 35, 45, 55, 60].indexOf(Number(amount)) !== -1 ? "reading_" + Number(amount) : "";
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
    if (window.TemploTracking && window.TemploTracking.read) return window.TemploTracking.read();
    return {};
  }

  function packageTitle(amount) {
    if (amount >= 59.99) return "Pacote Sagrado VIP - Tudo incluso + Atendimento Prioritário";
    if (amount >= 54.99) return "Leitura Completa - Amarração + Mão + Terceira Pessoa";
    if (amount >= 44.99) return "Amarração Amorosa com Leitura da Mão";
    if (amount >= 34.99) return "Amarração Amorosa - 5 perguntas e aproximação (Mais Escolhida)";
    if (amount >= 24.99) return "Leitura Amorosa com Oráculo de 30 dias";
    if (amount >= 14.99) return "Leitura Amorosa Essencial - 3 perguntas";
    return "Contribuição Simbólica Amorosa";
  }

  function track(amount) {
    var product = packageTitle(amount);
    if (window.TemploTracking && window.TemploTracking.trackInitiateCheckout) {
      window.TemploTracking.trackInitiateCheckout(amount, product);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("utmify:checkout", {
        detail: {currency: "BRL", value: amount, product: product}
      }));
    } catch (error) {}
  }

  function closeModal() {
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = null;
    if (pixTimerInterval) clearInterval(pixTimerInterval);
    var modal = document.getElementById("tdl-home-payment");
    if (modal) modal.remove();
  }

  function openModal(amount) {
    selectedAmount = amount;
    closeModal();
    var state = readState();
    var modal = document.createElement("div");
    modal.id = "tdl-home-payment";
    modal.className = "fixed inset-0 z-[260] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4";
    modal.innerHTML =
      '<div class="fixed inset-0" data-close-home-payment></div>' +
      '<div class="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[30px] border border-red-100 bg-white p-5 text-center shadow-2xl sm:max-w-[470px] sm:rounded-[30px]">' +
        '<button type="button" data-close-home-payment aria-label="Fechar" class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-2xl leading-none text-[#7f1d1d]">×</button>' +
        '<span class="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#92400e]">Contribuição selecionada</span>' +
        '<h2 class="mt-3 font-display text-2xl font-black text-[#2b0f0f]">' + packageTitle(selectedAmount) + '</h2>' +
        '<strong class="mt-2 block text-4xl font-black text-emerald-700">' + formatMoney(selectedAmount) + '</strong>' +
        '<div class="mt-4 space-y-2 text-left">' +
          '<label class="block text-[11px] font-bold uppercase tracking-wider text-[#7f1d1d]">Seu nome<input id="tdl-home-name" class="mt-1 h-12 w-full rounded-2xl border border-red-200 px-4 text-sm outline-none focus:border-emerald-500" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
          '<label class="block text-[11px] font-bold uppercase tracking-wider text-[#7f1d1d]">WhatsApp com DDD<input id="tdl-home-phone" inputmode="tel" class="mt-1 h-12 w-full rounded-2xl border border-red-200 px-4 text-sm outline-none focus:border-emerald-500" placeholder="(11) 99999-9999"></label>' +
          '<p id="tdl-home-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
        '</div>' +
        '<div id="tdl-home-pix" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-3"></div>' +
        '<button type="button" id="tdl-home-create-pix" class="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase text-white shadow-lg">Gerar PIX agora</button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-home-payment]").forEach(function (button) {
      button.addEventListener("click", closeModal);
    });
    modal.querySelector("#tdl-home-create-pix").addEventListener("click", createPix);
  }

  function showError(message) {
    var error = document.getElementById("tdl-home-error");
    if (!error) return;
    error.textContent = message;
    error.classList.remove("hidden");
  }

  function createPix() {
    var state = readState();
    var button = document.getElementById("tdl-home-create-pix");
    var name = (document.getElementById("tdl-home-name").value || state.nome || "").trim();
    var phone = digits(document.getElementById("tdl-home-phone").value);
    if (phone.length > 0 && phone.length < 10) {
      showError("Se informar WhatsApp, coloque com DDD.");
      return;
    }
    var SUPABASE_PIX_CREATE_URL = "/api/create-pix";
    var SUPABASE_PIX_STATUS_URL = "/api/check-purchase";

    button.disabled = true;
    button.textContent = "Gerando PIX...";
    track(selectedAmount);

    var pixPayload = {
      product_id: productIdForAmount(selectedAmount),
      amount: selectedAmount,
      name: name,
      phone: phone,
      ente: state.ente || "",
      letter: "Contribuição feita pela home da Leitura Amorosa.",
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
        button.textContent = "Gerar PIX agora";
      });
  }

  var pixTimerInterval = null;

  function renderPix(pix) {
    var box = document.getElementById("tdl-home-pix");
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
          '<span>⏳</span> <span id="tdl-home-countdown">15:00</span>' +
        '</div>' +
      '</div>' +

      '<div class="mt-4 mx-auto inline-block rounded-2xl border-2 border-emerald-400 bg-white p-3 shadow-md">' +
        '<img src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="210" height="210" class="block mx-auto rounded-lg">' +
        '<p class="mt-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Aponte a câmera do seu banco</p>' +
      '</div>' +

      '<button type="button" id="tdl-home-copy-pix" class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[13.5px] font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
        '<span id="tdl-home-copy-label">Copiar Código PIX Copia e Cola</span>' +
      '</button>' +

      '<textarea id="tdl-home-pix-code" readonly onclick="this.select()" title="Toque para selecionar" class="mt-2.5 h-16 w-full rounded-xl border border-emerald-200 bg-white p-2.5 text-[10px] text-stone-600 outline-none focus:border-emerald-500 font-mono select-all">' + escapeHtml(pix.pix_payload) + '</textarea>' +

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
          'Assim que o banco confirmar o pagamento, a página te redireciona automaticamente para o atendimento.' +
        '</p>' +
      '</div>' +

      '<div id="tdl-home-status" class="mt-3.5 flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-100/70 p-3 text-[12px] font-bold text-emerald-950">' +
        '<span class="relative flex h-3 w-3">' +
          '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>' +
          '<span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>' +
        '</span>' +
        '<span id="tdl-home-status-text">Aguardando confirmação do banco...</span>' +
      '</div>';

    pixTimerInterval = setInterval(function () {
      expiresSeconds--;
      if (expiresSeconds <= 0) {
        clearInterval(pixTimerInterval);
        var cd = document.getElementById("tdl-home-countdown");
        if (cd) cd.textContent = "Expirado";
      } else {
        var m = Math.floor(expiresSeconds / 60);
        var s = expiresSeconds % 60;
        var cd = document.getElementById("tdl-home-countdown");
        if (cd) cd.textContent = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
      }
    }, 1000);

    var copyBtn = document.getElementById("tdl-home-copy-pix");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var code = document.getElementById("tdl-home-pix-code");
        if (code) {
          code.select();
          code.setSelectionRange(0, 99999);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pix.pix_payload || code.value);
          } else {
            document.execCommand("copy");
          }
        }
        var label = document.getElementById("tdl-home-copy-label");
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
          var box = document.getElementById("tdl-home-status");
          var statusText = document.getElementById("tdl-home-status-text");
          if (!box) return;
          if (status.paid) {
            clearInterval(statusTimer);
            statusTimer = null;
            if (pixTimerInterval) clearInterval(pixTimerInterval);
            box.className = "mt-3.5 flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-500 p-3.5 text-[13px] font-black text-white shadow-lg";
            box.innerHTML = '<span>✓</span> <span>Pagamento confirmado! Abrindo seu atendimento...</span>';
            setTimeout(function () {
              window.location.href = "/confirmacao-atendimento-bencao-q39p?pedido=" + encodeURIComponent(pix.external_id);
            }, 1200);
          } else {
            if (statusText) {
              statusText.textContent = "Aguardando confirmação do PIX... " + (status.status || "pendente");
            }
          }
        })
        .catch(function () {})
        .finally(function () { polling = false; });
    }, 3000);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-home-contribution]");
    if (!button) return;
    event.preventDefault();
    openModal(Number(button.getAttribute("data-home-contribution")) || 20);
  }, true);
})();
