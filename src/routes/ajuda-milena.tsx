import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Halos, Reveal, Stars, Footer } from "@/components/funnel/Shell";
import { PixCheckout } from "@/components/funnel/PixCheckout";
import { StripeCardModal } from "@/components/funnel/StripeCardModal";
import { IMAGES } from "@/components/funnel/data";

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
    msg: "Que Jesus ilumine seus olhos, Milena querida!",
    val: "R$ 29,00",
  },
  {
    name: "Carlos Eduardo M.",
    city: "Belo Horizonte/MG",
    msg: "Pelo consolo que me deu com a carta do meu filho.",
    val: "R$ 47,00",
  },
  {
    name: "Maria Aparecida S.",
    city: "Curitiba/PR",
    msg: "Uma bênção de amor. Força, Milena!",
    val: "R$ 19,00",
  },
  {
    name: "Helena R.",
    city: "Rio de Janeiro/RJ",
    msg: "Gratidão eterna pelas palavras de paz.",
    val: "R$ 35,00",
  },
];

interface SurgeryPsychologicalImpact {
  tier: "eye_drops" | "exams" | "lens" | "complete";
  icon: string;
  badge: string;
  title: string;
  description: string;
  badgeColor: string;
  cardBorder: string;
  isValid: boolean;
}

function getSurgeryPsychologicalImpact(amount: number): SurgeryPsychologicalImpact {
  if (amount < 10) {
    return {
      tier: "eye_drops",
      icon: "💧",
      badge: "Ajuda Simbólica",
      title: "Colírios e Assepsia Pré-Operatória",
      description:
        "Sua contribuição fraterna ajuda nos medicamentos preparatórios para o procedimento cirúrgico de Milena.",
      badgeColor: "bg-amber-50 text-[#92400e] border-[#fde68a]",
      cardBorder: "border-amber-200 bg-amber-50/40",
      isValid: false,
    };
  }
  if (amount < 25) {
    return {
      tier: "exams",
      icon: "🔬",
      badge: "⭐ Escolha Solidária Popular",
      title: "Exames de Mapeamento de Retina",
      description:
        "Cobre o custo de biomicroscopia e exames essenciais para que o cirurgião planeje a cirurgia de Milena.",
      badgeColor: "bg-amber-100 text-[#92400e] border-[#f59e0b]/50",
      cardBorder: "border-[#f59e0b] bg-[#fefaf3]",
      isValid: true,
    };
  }
  if (amount < 45) {
    return {
      tier: "lens",
      icon: "👁️",
      badge: "Lente Intraocular Dobrável",
      title: "Aporte Direto na Lente Intraocular",
      description:
        "Ajuda a custear a prótese óptica que substituirá o cristalino opaco, devolvendo a visão nítida para a médium.",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      cardBorder: "border-purple-300 bg-purple-50/40",
      isValid: true,
    };
  }

  return {
    tier: "complete",
    icon: "🕊️",
    badge: "Bênção de Luz e Cura",
    title: "Apoio Amplo à Cirurgia e Pós-Operatório",
    description:
      "Um gesto grandioso de gratidão. Garante o procedimento cirúrgico e todo o repouso necessário para Milena voltar a psicografar com plenitude.",
    badgeColor:
      "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs",
    cardBorder: "border-amber-400 bg-gradient-to-br from-[#fffbeb] via-[#fffdfa] to-[#fef3c7]",
    isValid: true,
  };
}

const DONATION_INCREMENTS = [8.5, 14.2, 6.75, 12.0, 9.4, 15.6, 7.8, 11.3];

export function AjudaMilenaPage() {
  const META_TOTAL = 8500.0;
  const [arrecadado, setArrecadado] = useState(109.87);
  const [selectedAmount, setSelectedAmount] = useState<number>(19);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [donorIdx, setDonorIdx] = useState(0);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);

  useEffect(() => {
    let tick = 0;
    const timer = setInterval(() => {
      const incremento = DONATION_INCREMENTS[tick % DONATION_INCREMENTS.length] ?? 10;
      tick += 1;
      setArrecadado((prev) => Math.min(prev + incremento, META_TOTAL));
      setDonorIdx((prev) => (prev + 1) % RECENT_DONORS_LIST.length);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const activeAmount = isCustom ? Number(customInput) || 0 : selectedAmount;
  const impact = getSurgeryPsychologicalImpact(activeAmount);
  const pct = Math.min(Math.round((arrecadado / META_TOTAL) * 100), 100);
  const currentDonor = RECENT_DONORS_LIST[donorIdx] ?? RECENT_DONORS_LIST[0]!;

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
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
              <span>🙏 Um Pedido do Coração</span>
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
              <p className="block text-[11.5px] font-bold tracking-wider text-[#2d144d] uppercase mb-2">
                Escolha o valor que o seu coração deseja doar:
              </p>
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
                <label htmlFor="ajuda-custom-amount" className="block text-[11.5px] font-bold text-[#2d144d] mb-1">
                  Digite o valor da sua contribuição (mínimo de R$ 10,00):
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-base font-black text-[#2d144d]">R$</span>
                  <input
                    id="ajuda-custom-amount"
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
            <button
              type="button"
              onClick={() => setStripeModalOpen(true)}
              className="utmify-initiate-checkout mt-4 block w-full py-3.5 px-4 rounded-2xl border-2 border-[#d5c3ea] bg-[#f9f5fd] hover:bg-[#f2eafb] text-[#2d144d] font-bold text-[13px] transition-all text-center cursor-pointer shadow-2xs"
            >
              💳 Prefere doar no Cartão de Crédito ou Parcelar? Clique aqui ›
            </button>

            <StripeCardModal
              isOpen={stripeModalOpen}
              onClose={() => setStripeModalOpen(false)}
              productId="cirurgia_milena"
              amountCents={Math.round((activeAmount >= 10 ? activeAmount : 19) * 100)}
            />

            {/* Info pós-PIX */}
            <div className="mt-5 pt-4 border-t border-[#ece4f4]">
              <p className="text-[12px] text-[#786445] text-center leading-relaxed">
                ✨ Após confirmar o pagamento PIX ou Cartão, você será redirecionado(a) automaticamente.
              </p>
            </div>
          </Reveal>


        </div>

        <Footer />
      </div>
    </div>
  );
}
