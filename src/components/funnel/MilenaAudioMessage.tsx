import milenaAudio from "../../assets/media/audio/audio-milena.mp3";
import { IMAGES } from "./data";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

const transcript = [
  "Olá. Aqui é a Milena Medeiros.",
  "Antes de qualquer coisa, eu quero te parabenizar pelo passo que você deu até aqui. Abrir o coração, lembrar de alguém tão importante e colocar em palavras aquilo que você sente exige coragem, carinho e muita verdade. Eu recebo a sua intenção com respeito e com todo o cuidado que esse momento merece.",
  "Quero também te explicar com calma o que acontece agora. A psicografia não é vendida. Meu trabalho, minha prece e o acolhimento espiritual são oferecidos por amor e caridade. A contribuição que aparece nesta página é voluntária e serve para manter os materiais físicos usados no oratório.",
  "Entre esses materiais está a vela de sete dias, preparada com o nome e a intenção da família. Para nós, essa vela representa a continuidade da prece e do acolhimento durante o trabalho. Também utilizamos o pergaminho onde a mensagem é escrita, além dos materiais necessários para manter o espaço e as ações de caridade da casa.",
  "Se estiver ao seu alcance contribuir hoje, escolha com tranquilidade o valor que cabe no seu momento. Você pode pagar por PIX, com confirmação em poucos segundos, ou por cartão. Depois da confirmação, a própria página vai orientar você nos próximos passos. É simples e seguro.",
  "A sua contribuição não compra uma mensagem e não promete um resultado. Ela ajuda a manter acesa a estrutura que permite que este trabalho de acolhimento continue chegando a outras famílias.",
  "Obrigada pela confiança e por ter chegado até aqui. Respire com calma, escolha o valor que fizer sentido para você e siga pelo botão logo abaixo. Vou receber a sua intenção com carinho e respeito.",
];

export function MilenaAudioMessage() {
  return (
    <section className="mt-7 overflow-hidden rounded-3xl border border-amber-300/70 bg-gradient-to-br from-[#fff8e6] via-white to-[#f6f0fc] shadow-xl shadow-amber-900/10">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 text-left">
          <img
            src={IMAGES.medium}
            alt="Milena Medeiros"
            className="h-14 w-14 shrink-0 rounded-2xl border-2 border-amber-300 object-cover object-top shadow-md"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#92400e] ring-1 ring-amber-200">
              Ouça antes de escolher
            </span>
            <h3 className="mt-2 font-display text-[20px] font-extrabold leading-tight text-[#1f1035]">
              Uma mensagem da Milena para você
            </h3>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-[#5e4b73]">
              Ela explica, com calma, por que a vela e os materiais do oratório são importantes para manter este acolhimento.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <CustomAudioPlayer
            src={milenaAudio}
            title="Explicação da Médium Milena"
            subtitle="Por que os materiais do oratório são preparados"
            defaultDuration={277}
            theme="purple"
            ariaLabel="Mensagem em áudio de Milena Medeiros sobre a contribuição das velas"
          />
        </div>

        <details className="mt-3 rounded-2xl border border-amber-200/80 bg-white/70 px-3 py-2 text-left">
          <summary className="cursor-pointer text-[12px] font-extrabold text-[#78350f]">
            Ler a mensagem do áudio
          </summary>
          <div className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[#4a3b60]">
            {transcript.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
