import cartaExemplo from "@/assets/exemplo-carta.jpeg";
import logoTemplo from "@/assets/logo-templo-de-luz.png";
import mediumMilena from "@/assets/medium-milena.jpeg";
import milenaEmocionada from "@/assets/milena.webp";
import heroTemplo from "@/assets/templodeluz-hero.webp";
import seloCheckout from "@/assets/checkout-selo.png";
import seloPomba from "@/assets/pomba-seguro.png";
import heroBgImage from "@/assets/hero-image.jpeg";
import milenaOratorioImg from "@/assets/milena-oratorio.jpeg";
import mediumMilenaPssImg from "@/assets/medium-milena-pss.jpeg";

export const IMAGES = {
  hero: heroTemplo,
  logo: logoTemplo,
  carta: cartaExemplo,
  medium: mediumMilena,
  milenaCatarata: milenaEmocionada,
  seloCheckout: seloCheckout,
  seloPomba: seloPomba,
  heroBg: heroBgImage,
  milenaOratorio: milenaOratorioImg,
  milenaPss: mediumMilenaPssImg,
};

export const CHECKOUT_URL = "https://pay.cakto.com.br/amnpmje_1071513";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Como a carta é psicografada?",
    a: "A médium Milena Medeiros entra em recolhimento espiritual e oração profunda com o nome que você informou no altar. Em transe mediúnico de sintonia, a mensagem é vertida inteiramente à mão no papel de algodão — manifestando os traços originais da caligrafia, expressões de afeto, memórias íntimas e a assinatura do seu ente querido. Nada é digital ou gerado por computador.",
  },
  {
    q: "Em quanto tempo a mensagem chega no meu WhatsApp?",
    a: "A sessão de psicografia ocorre exatamente no horário reservado para você no oratório. Assim que a carta é concluída à mão e abençoada diante da vela sagrada, você recebe as fotografias em alta resolução da carta original manuscrita diretamente no seu WhatsApp em até 24 horas — na maioria dos casos, no mesmo dia.",
  },
  {
    q: "Por que é solicitada uma contribuição fraterna se a psicografia é gratuita?",
    a: "O acolhimento e a mensagem espiritual são gratuitos. A contribuição fraterna livre, a partir de R$20, ajuda a cobrir os materiais físicos usados no oratório, como a vela de 7 dias, as folhas especiais e os itens de preparação, além de apoiar as ações assistenciais da casa.",
  },
  {
    q: "E se a carta não tocar o meu coração ou não fizer sentido?",
    a: "Você conta com a nossa Garantia Sagrada de 7 dias. Se por qualquer motivo a mensagem não trouxer a paz, a certeza e a confirmação que a sua alma procura, basta nos avisar pelo WhatsApp ou e-mail e devolveremos 100% da sua contribuição imediatamente, sem questionamentos e com a mesma fraternidade.",
  },
  {
    q: "As informações e o nome de quem partiu ficam em sigilo?",
    a: "Sigilo absoluto e sagrado. O nome de quem partiu e o desabafo do seu coração são mantidos em segredo no oratório da médium, utilizados unicamente como ponte de sintonia energética para a sessão de psicografia.",
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
