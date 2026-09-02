import cartaExemplo from "@/assets/exemplo-carta.jpeg";
import logoTemplo from "@/assets/logo-templo-de-luz.png";
import mediumMilena from "@/assets/medium-milena.jpeg";
import milenaEmocionada from "@/assets/milena.webp";
import heroTemplo from "@/assets/templodeluz-hero.webp";
import seloCheckout from "@/assets/checkout-selo.png";
import seloPomba from "@/assets/pomba-seguro.png";

export const IMAGES = {
  hero: heroTemplo,
  logo: logoTemplo,
  carta: cartaExemplo,
  medium: mediumMilena,
  milenaCatarata: milenaEmocionada,
  seloCheckout: seloCheckout,
  seloPomba: seloPomba,
};

export const CHECKOUT_URL = "https://pay.cakto.com.br/amnpmje_1071513";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Como a carta é psicografada?",
    a: "A médium Milena Medeiros entra em recolhimento espiritual e oração profunda com o nome que você informou. Em transe mediúnico, a mensagem é escrita inteiramente à mão no papel — manifestando os traços da caligrafia, expressões afetivas e a assinatura original do seu ente querido. Nada é digital ou gerado por computador.",
  },
  {
    q: "Em quanto tempo a mensagem chega no meu WhatsApp?",
    a: "A sessão de psicografia ocorre no horário reservado para você. Assim que a carta é concluída e abençoada, você recebe as fotos em alta resolução da carta original manuscrita diretamente no seu WhatsApp em até 24 horas — na maioria dos casos, no mesmo dia.",
  },
  {
    q: "Por que é pedida uma doação simbólica de R$ 27,90 se a carta é caridade?",
    a: "A mediunidade e a mensagem são um ato de amor e caridade espiritual. A pequena contribuição simbólica de R$ 27,90 é destinada exclusivamente à manutenção do Templo de Luz, aquisição dos materiais sagrados (velas, papéis especiais, incensos) e ao auxílio alimentar das famílias acolhidas pela nossa casa.",
  },
  {
    q: "E se a carta não tocar o meu coração ou não fizer sentido?",
    a: "Você conta com a nossa Garantia Sagrada de 7 dias. Se por qualquer motivo a mensagem não trouxer a paz e a confirmação que a sua alma procura, basta nos avisar e devolveremos 100% da sua doação imediatamente, sem burocracias e com o mesmo respeito.",
  },
  {
    q: "As informações e memórias que compartilhei ficam em sigilo?",
    a: "Sigilo absoluto. O nome de quem partiu e o desabafo do seu coração são mantidos em segredo sagrado no oratório da médium, utilizados unicamente como ponte de sintonia energética para a psicografia.",
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
