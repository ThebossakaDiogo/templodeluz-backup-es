import cartaExemplo from "@/assets/images/quiz/carta-psicografada.webp";
import mediumMilena from "@/assets/medium-milena.webp";
import milenaEmocionada from "@/assets/milena.webp";
import seloCheckout from "@/assets/checkout-selo.webp";
import seloPomba from "@/assets/pomba-seguro.webp";
import milenaOratorioImg from "@/assets/milena-oratorio.webp";
import mediumMilenaPssImg from "@/assets/medium-milena-pss.webp";

export const IMAGES = {
  carta: cartaExemplo,
  medium: mediumMilena,
  milenaCatarata: milenaEmocionada,
  seloCheckout: seloCheckout,
  seloPomba: seloPomba,
  milenaOratorio: milenaOratorioImg,
  milenaPss: mediumMilenaPssImg,
};

export const CHECKOUT_URL = "https://pay.cakto.com.br/amnpmje_1071513";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Como funciona o atendimento?",
    a: "O atendimento é conduzido pela médium Milena Medeiros em momento sagrado de oração e recolhimento no oratório, sintonizando as intenções registradas para acolher você e seu ente querido.",
  },
  {
    q: "A contribuição é obrigatória?",
    a: "Não. A contribuição apresentada é voluntária, e você encontrará na página a opção clara para continuar para o pergaminho sem realizar uma contribuição neste momento.",
  },
  {
    q: "Estou pagando pela psicografia?",
    a: "Não. Conforme informado pela casa, jamais há cobrança pela psicografia. A contribuição sugerida destina-se exclusivamente aos materiais do oratório (como vela consagrada e papel especial) e às atividades de manutenção fraterna.",
  },
  {
    q: "Quando saberei o próximo passo?",
    a: "Assim que você escolher como continuar, a próxima tela apresentará as informações correspondentes antes de qualquer confirmação definitiva. Nada é cobrado sem a sua confirmação.",
  },
  {
    q: "Minhas informações ficam protegidas?",
    a: "Sim, com sigilo absoluto e sagrado. Seu nome, o nome do seu ente querido e as intenções registradas são confidenciais, guardadas no oratório e nunca compartilhadas com terceiros.",
  },
];

export const STEPS_HOW = [
  {
    icon: "🕯️",
    title: "Abertura do Elo Espiritual",
    text: "Você partilha o nome de quem partiu e aquilo que o seu coração mais anseia dizer ou ouvir.",
  },
  {
    icon: "✍️",
    title: "O Recolhimento Mediúnico",
    text: "Milena Medeiros entra em conexão no horário agendado e verte a mensagem à mão no papel.",
  },
  {
    icon: "💌",
    title: "O Abraço em Forma de Carta",
    text: "A foto da carta original manuscrita, com traços, caligrafia e assinatura, é enviada ao seu WhatsApp.",
  },
];
