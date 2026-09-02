import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Halos, Reveal, Stars, Footer } from "@/components/funnel/Shell";
import { PixCheckout } from "@/components/funnel/PixCheckout";
import { IMAGES, CHECKOUT_URL } from "@/components/funnel/data";

export const Route = createFileRoute("/ajuda-milena")({
  head: () => ({
    meta: [
      { title: "Carta Confirmada · Ajude na Cirurgia da Médium Milena | Templo de Luz" },
      {
        name: "description",
        content:
          "Sua carta já foi confirmada. Participe da corrente de amor para a cirurgia de catarata da médium Milena Medeiros antes de acessar seu WhatsApp.",
      },
    ],
  }),
  component: AjudaMilenaPage,
});

const RECENT_DONORS_LIST = [
  {
    name: "Dona Neusa F.",
    city: "Campinas/SP",
    msg: "Que Deus abençoe seus olhos, querida Milena!",
  },
  { name: "Sr. Geraldo M.", city: "Belo Horizonte/MG", msg: "Por gratidão à carta do meu filho." },
  {
    name: "Cláudia R.",
    city: "Rio de Janeiro/RJ",
    msg: "Força, Milena! Você ainda vai consolar muitos corações.",
  },
  {
    name: "Marcos V.",
    city: "Porto Alegre/RS",
    msg: "Minha pequena contribuição com todo o amor.",
  },
  { name: "Helena S.", city: "Brasília/DF", msg: "Em oração pela sua cura e pelo Templo de Luz." },
  {
    name: "Paulo H.",
    city: "Curitiba/PR",
    msg: "Deus restaure sua visão para continuar essa missão.",
  },
  { name: "Terezinha B.", city: "Salvador/BA", msg: "Gratidão eterna pelas palavras de paz." },
];

function getSurgeryPsychologicalImpact(amount: number) {
  if (amount < 10) {
    return {
      icon: "⚠️",
      badge: "Contribuição Mínima Fraterna",
      title: "Mínimo de R$ 10,00",
      description:
        "Este valor mínimo de R$ 10,00 ajuda a custear os colírios pré-operatórios de assepsia e exames básicos de biometria ocular para a cirurgia de Milena.",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-300 bg-red-50/40",
      isValid: false,
    };
  }
  if (amount < 15) {
    return {
      icon: "💧",
      badge: "Colírios e Preparação",
      title: "Colírios e Preparação Ocular",
      description:
        "Custeia a medicação pré-operatória e os exames de mapeamento de retina essenciais para a cirurgia de catarata de Milena.",
      badgeColor: "bg-zinc-100 text-zinc-800 border-zinc-300",
      cardBorder: "border-zinc-200 bg-zinc-50/50",
      isValid: true,
    };
  }
  if (amount < 25) {
    return {
      icon: "✨",
      badge: "⭐ Mais Escolhido pelo Coração",
      title: "Aporte Cirúrgico & Lente Intraocular",
      description:
        "Contribui diretamente para a compra da lente intraocular dobrável de alta precisão que devolverá a nitidez da escrita de Milena.",
      badgeColor: "bg-amber-100 text-[#92400e] border-[#f59e0b]/50",
      cardBorder: "border-[#f59e0b] bg-[#fefaf3]",
      isValid: true,
    };
  }
  if (amount < 35) {
    return {
      icon: "👁️",
      badge: "Protetor da Visão de Milena",
      title: "Insumos Hospitalares de Facoemulsificação",
      description:
        "Garante os insumos cirúrgicos hospitalares para recuperar a visão do olho direito da médium.",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      cardBorder: "border-purple-300 bg-purple-50/40",
      isValid: true,
    };
  }
  if (amount < 50) {
    return {
      icon: "🕊️",
      badge: "Mantenedor da Cura",
      title: "Cirurgia Completa & Pós-Operatório",
      description:
        "Cobre uma parte expressiva da equipe médica e do pós-operatório, garantindo que Milena retome as cartas manuscritas sem dor.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      cardBorder: "border-emerald-400 bg-emerald-50/50",
      isValid: true,
    };
  }
  return {
    icon: "👑",
    badge: "Anjo Protetor da Missão Sagrada",
    title: "Bênção Maior · Oração Perpétua de Milena",
    description:
      "Um ato divino de amor. Milena colocará pessoalmente seu nome em sua primeira vigília de oração com a visão totalmente restaurada.",
    badgeColor:
      "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs",
    cardBorder: "border-amber-400 bg-gradient-to-br from-[#fffbeb] via-[#fffdfa] to-[#fef3c7]",
    isValid: true,
  };
}

export function AjudaMilenaPage() {
  const META_TOTAL = 8500.0;
  // Inicia com 109.87 conforme solicitado
  const [arrecadado, setArrecadado] = useState(109.87);
  const [selectedAmount, setSelectedAmount] = useState<number>(29);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [donorIdx, setDonorIdx] = useState(0);

  // Simulação realista: sobe entre R$ 3,00 e R$ 16,00 a cada 15 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      const incremento =
        Math.floor(Math.random() * (16 - 3 + 1)) + 3 + Math.floor(Math.random() * 90) / 100;
      setArrecadado((prev) => Math.min(prev + incremento, META_TOTAL));
      setDonorIdx((prev) => (prev + 1) % RECENT_DONORS_LIST.length);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const activeAmount = isCustom ? Number(customInput) || 0 : selectedAmount;
  const impact = getSurgeryPsychologicalImpact(activeAmount);
  const pct = Math.min(Math.round((arrecadado / META_TOTAL) * 100), 100);
  const currentDonor = RECENT_DONORS_LIST[donorIdx];

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIsCustom(true);
    setCustomInput(raw);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#181126] antialiased selection:bg-[#fde68a] selection:text-[#181126]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#fbf9f5] shadow-2xl border-x border-[#ece4f4] pb-24">
        {/* Banner Superior de Sucesso da Compra */}
        <div className="bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm">
          <span>✅</span>
          <span>Sua Carta Psicografada já está confirmada no oratório!</span>
        </div>

        {/* Top Header Sagrado */}
        <header className="relative overflow-hidden bg-gradient-to-b from-[#2d144d] via-[#1f0c36] to-[#120422] px-6 pt-9 pb-9 text-center text-white">
          <Halos />
          <div className="relative z-10 flex flex-col items-center">
            <Stars />
            <span className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-white/10 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shadow-xs shadow-amber-400" />
              🙏 Um Pedido do Coração
            </span>

            <h1 className="font-display mt-5 text-[25px] leading-[1.25] font-black text-white tracking-tight drop-shadow-md">
              Antes de ir para o WhatsApp: Um apelo urgente pela visão da{" "}
              <span className="text-[#fde68a] not-italic underline decoration-amber-400/60 decoration-2 underline-offset-4">
                Médium Milena
              </span>
            </h1>

            <p className="mt-3 max-w-[340px] text-[14px] leading-relaxed text-zinc-200 font-normal">
              Após 33 anos confortando mais de 12 mil famílias, Milena enfrenta um grave problema de
              catarata que ameaça impedi-la de continuar escrevendo.
            </p>
          </div>
        </header>

        {/* Faixa de Acolhimento */}
        <div className="flex items-center justify-center gap-3 bg-[#f6f0fc] border-b border-[#ece4f4] px-4 py-3 text-[12.5px] text-[#2d144d]">
          <span className="font-bold">🎯 Meta Cirúrgica: R$ 8.500</span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="font-bold text-[#b45309]">🤍 Doação 100% Voluntária</span>
        </div>

        <div className="px-6 pt-7">
          {/* Foto Emocionante da Médium Milena com Efeito de Nuvem / Névoa Celestial */}
          <Reveal className="relative w-full my-4 flex flex-col items-center justify-center">
            {/* Aura de Luz e Nuvem no Fundo */}
            <div className="absolute inset-0 -m-6 rounded-full cloud-aura blur-2xl pointer-events-none opacity-80" />

            {/* Imagem com Máscara Suave de Nuvem (sem bordas de card) */}
            <div className="relative w-full max-w-[400px] flex justify-center cloud-mask-ethereal">
              <img
                src={IMAGES.milenaCatarata}
                alt="Médium Milena Medeiros emocionada ao escrever cartas"
                className="w-full h-auto max-h-[360px] object-cover object-top drop-shadow-lg"
              />
            </div>

            {/* Legenda com Efeito de Nuvem Suave */}
            <div className="mt-3 text-center max-w-[380px] px-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-amber-300/80 text-[11px] font-extrabold text-[#92400e] uppercase shadow-xs">
                <span>✦</span> Milena Medeiros · 67 Anos
              </span>
              <p className="mt-2 text-[13px] text-[#4d3a63] font-semibold italic leading-snug">
                “Minhas mãos ainda sentem a presença espiritual... mas meus olhos já quase não
                enxergam as linhas do papel.”
              </p>
            </div>
          </Reveal>

          {/* A História & O Apelo */}
          <Reveal className="rounded-3xl border border-[#ece4f4] bg-white p-6 shadow-md text-left space-y-4">
            <h2 className="font-display text-[20px] font-extrabold text-[#181126] leading-snug">
              Ela passou a vida curando a dor dos outros. Hoje, é a nossa vez de estender a mão.
            </h2>

            <p className="text-[14px] text-[#5e4b73] leading-relaxed">
              Durante mais de três décadas, a médium Milena Medeiros nunca cobrou um único centavo
              para sentar à mesa, recolher-se em oração e canalizar cartas psicografadas para mães,
              pais e filhos em luto.
            </p>

            <p className="text-[14px] text-[#5e4b73] leading-relaxed">
              Recentemente, um quadro severo de{" "}
              <strong className="text-[#181126]">catarata bilateral avançada</strong> cobriu sua
              visão com uma névoa densa. A cada carta, as dores de cabeça e o esforço nos olhos
              aumentam. Com lágrimas, Milena chegou a confidenciar aos mentores que{" "}
              <em>teria que se aposentar e interromper as cartas</em> por não conseguir mais ler o
              que escreve.
            </p>

            <div className="p-4 rounded-2xl bg-[#fefaf3] border border-[#fde68a] text-[13.5px] text-[#92400e] leading-relaxed font-medium">
              🕊️ <strong>A Solução:</strong> Uma cirurgia oftalmológica especializada de
              facoemulsificação com implante de lentes pode devolver 100% da nitidez aos seus olhos,
              permitindo que ela continue por muitos anos sua sagrada missão de amor.
            </div>
          </Reveal>

          {/* ── CARD DA META COLETIVA COM SIMULAÇÃO EM TEMPO REAL ── */}
          <Reveal className="mt-6 rounded-3xl border-2 border-[#f59e0b] bg-white p-6 shadow-xl text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[11px] font-extrabold tracking-wider text-[#92400e] uppercase mb-2">
              🎯 Campanha Solidária em Andamento
            </span>

            <h3 className="font-display text-[21px] font-extrabold text-[#181126]">
              Meta da Cirurgia de Catarata
            </h3>

            {/* Valor Arrecadado e Barra */}
            <div className="mt-4 p-4 rounded-2xl bg-[#fbf9f5] border border-[#ece4f4]">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#786445]">
                  Arrecadado até agora
                </span>
                <span className="font-display text-[26px] font-black text-emerald-600">
                  R${" "}
                  {arrecadado.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-[#f0e8f7] p-0.5 border border-[#e5daf0]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 transition-all duration-1000 shadow-xs"
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#6c5a82]">
                <span>{pct}% da meta alcançada</span>
                <span>
                  Objetivo: <strong>R$ 8.500,00</strong>
                </span>
              </div>
            </div>

            {/* Ticker de doações recentes dinâmico */}
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#fffdfa] border border-[#fde68a] p-3 text-left shadow-2xs">
              <span className="text-xl animate-bounce shrink-0">💖</span>
              <div className="flex-1 text-[12px] leading-snug">
                <span className="font-bold text-[#2d144d]">{currentDonor.name}</span>{" "}
                <span className="text-[#8e7a60]">({currentDonor.city})</span>
                <p className="mt-0.5 text-[#6c5a82] italic">"{currentDonor.msg}"</p>
              </div>
            </div>

            {/* Seletor de Valor da Doação */}
            <div className="mt-6 text-left">
              <label className="block text-[11.5px] font-bold tracking-wider text-[#2d144d] uppercase mb-2">
                Escolha o valor que o seu coração deseja doar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 10, tag: "Colírios" },
                  { val: 15, tag: "Exames Básicos" },
                  { val: 19, tag: "⭐ Mais Escolhido", highlight: true },
                  { val: 29, tag: "Lente Intraocular" },
                  { val: 47, tag: "Aporte Cirúrgico" },
                ].map((item) => {
                  const isSelected = !isCustom && selectedAmount === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSelectPreset(item.val)}
                      className={`relative py-2.5 px-2 rounded-2xl text-center transition-all duration-200 border-2 cursor-pointer ${
                        isSelected
                          ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] shadow-md scale-[1.02]"
                          : "border-[#ece4f4] bg-white text-[#2d144d] hover:border-[#f59e0b]/50"
                      }`}
                    >
                      {item.highlight && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#b45309] px-2 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider whitespace-nowrap shadow-xs">
                          Popular
                        </span>
                      )}
                      <span className="block text-[15px] font-black leading-tight">
                        R$ {item.val}
                      </span>
                      <span className="block text-[9.5px] font-semibold text-[#786445] truncate mt-0.5">
                        {item.tag}
                      </span>
                    </button>
                  );
                })}

                {/* Botão Outro Valor */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    if (!customInput) setCustomInput("35");
                  }}
                  className={`py-2.5 px-2 rounded-2xl text-center transition-all duration-200 border-2 cursor-pointer ${
                    isCustom
                      ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] shadow-md scale-[1.02]"
                      : "border-[#ece4f4] bg-white text-[#2d144d] hover:border-[#f59e0b]/50"
                  }`}
                >
                  <span className="block text-[14px] font-black leading-tight">✍️ Outro</span>
                  <span className="block text-[9.5px] font-semibold text-[#786445] mt-0.5">
                    Digitar Valor
                  </span>
                </button>
              </div>
            </div>

            {/* Input de Valor Personalizado */}
            {isCustom && (
              <div className="mt-3.5 p-3 rounded-2xl bg-[#fbf9f5] border border-[#fde68a] text-left animate-rise-in">
                <label className="block text-[11.5px] font-bold text-[#2d144d] mb-1">
                  Digite o valor da sua contribuição (mínimo de R$ 10,00):
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-base font-black text-[#2d144d]">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customInput}
                    onChange={handleCustomChange}
                    placeholder="Ex: 50"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-[#e5daf0] focus:border-[#f59e0b] bg-white text-[16px] font-black text-[#181126] outline-hidden shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* ── CARD PSICOLÓGICO DINÂMICO CONFORME O VALOR ESCOLHIDO ── */}
            <div
              className={`mt-4 rounded-2xl border-2 p-4 text-left shadow-xs transition-all duration-300 ${impact.cardBorder}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide border ${impact.badgeColor}`}
                >
                  <span>{impact.icon}</span>
                  {impact.badge}
                </span>
                <span className="text-[13px] font-black text-[#2d144d]">
                  R${" "}
                  {activeAmount > 0
                    ? activeAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                    : "0,00"}
                </span>
              </div>

              <h4 className="text-[13.5px] font-extrabold text-[#181126] leading-snug">
                {impact.title}
              </h4>
              <p className="text-[12px] text-[#5e4b73] mt-1 leading-relaxed">
                {impact.description}
              </p>

              {activeAmount < 10 && (
                <div className="mt-2.5 p-2 rounded-xl bg-red-100/70 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
                  ⚠️ O valor mínimo de R$ 10,00 é necessário para os colírios de assepsia e exames
                  pré-cirúrgicos de Milena.
                </div>
              )}
            </div>

            {impact.isValid ? (
              <PixCheckout productId="cirurgia_milena" amountCents={Math.round(activeAmount * 100)} />
            ) : (
              <div className="mt-6 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
                Por favor, selecione ou digite um valor a partir de R$ 10,00 para gerar o código
                PIX.
              </div>
            )}

            {/* Opção Doar com Cartão */}
            <a
              href={CHECKOUT_URL}
              className="mt-4 block w-full py-3.5 px-4 rounded-2xl border-2 border-[#d5c3ea] bg-[#f9f5fd] hover:bg-[#f2eafb] text-[#2d144d] font-bold text-[13px] transition-all text-center shadow-2xs"
            >
              💳 Prefere doar no Cartão de Crédito ou Parcelar? Clique aqui ›
            </a>

            {/* Info pós-PIX */}
            <div className="mt-5 pt-4 border-t border-[#ece4f4]">
              <p className="text-[12px] text-[#786445] text-center leading-relaxed">
                ✨ Após confirmar o pagamento PIX, você será redirecionado(a) automaticamente.
              </p>
            </div>
          </Reveal>


        </div>

        <Footer />
      </div>
    </div>
  );
}
