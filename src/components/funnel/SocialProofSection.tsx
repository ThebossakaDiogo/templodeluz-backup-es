import feedbackOne from "../../assets/media/feedbacks/Feedback.webp";
import feedbackTwo from "../../assets/media/feedbacks/Feedback2.webp";
import feedbackVideo from "../../assets/media/feedbacks/Feedback3.mp4";
import feedbackVideoTwo from "../../assets/media/feedbacks/Feedback4.mp4";
import feedbackVideoTwoPoster from "../../assets/media/feedbacks/Feedback4-poster.webp";
import feedbackVideoPoster from "../../assets/media/feedbacks/Feedback3-poster.webp";
import feedbackVideoThree from "../../assets/media/feedbacks/Feedback5.mp4";
import feedbackVideoThreePoster from "../../assets/media/feedbacks/Feedback5-poster.webp";
import { Reveal } from "./Shell";

const feedbackImages = [
  {
    src: feedbackOne,
    alt: "Relato de agradecimento por carta psicografada recebido via WhatsApp",
  },
  {
    src: feedbackTwo,
    alt: "Depoimento real de conforto espiritual recebido via WhatsApp",
  },
];

export function SocialProofSection() {
  return (
    <Reveal className="mb-7">
      <section className="overflow-hidden rounded-3xl border border-[#e5daf0] bg-white shadow-[0_24px_70px_-36px_rgba(45,20,77,0.42)]">
        <div className="bg-gradient-to-br from-[#2d144d] via-[#3b1c63] to-[#171020] px-5 py-6 text-center text-white sm:px-7 sm:py-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-200">
            Relatos recebidos pelo Templo
          </span>
          <h2 className="mx-auto mt-3 max-w-[390px] font-display text-[24px] font-black leading-tight sm:text-[28px]">
            Antes de continuar, veja o que outras famílias sentiram
          </h2>
          <p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-relaxed text-[#e8dff4] sm:text-sm">
            Mensagens reais enviadas após o acolhimento espiritual e cartas manuscritas da médium Milena.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-3xl border border-[#e5daf0] bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-3 px-1 text-left">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#5d4786]">
                  Relato em vídeo
                </span>
                <strong className="mt-0.5 block text-sm text-[#241535]">
                  Uma experiência compartilhada com o Templo
                </strong>
              </div>
            </div>

            <div className="relative mx-auto max-w-[330px] overflow-hidden rounded-2xl bg-black shadow-[0_20px_50px_-22px_rgba(0,0,0,0.72)] ring-1 ring-black/10">
              <video
                controls
                playsInline
                preload="none"
                controlsList="nodownload"
                poster={feedbackVideoPoster}
                aria-label="Depoimento em vídeo de uma família acolhida"
                className="block aspect-[576/694] w-full bg-black object-contain"
              >
                <source src={feedbackVideo} type="video/mp4" />
                Seu navegador não oferece suporte à reprodução deste vídeo.
              </video>
            </div>

            <p className="mx-auto mt-3 max-w-[390px] text-center text-[11.5px] leading-relaxed text-[#6c5a82]">
              Toque no vídeo para ouvir o relato recebido pelo Templo de Luz.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-[#e5daf0] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#f0eaf5] px-4 py-3 text-left">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#5d4786]">Relato em vídeo</span>
                  <strong className="mt-0.5 block text-sm text-[#241535]">Mensagem compartilhada por uma família</strong>
                </div>
                <span className="rounded-full bg-[#f2eef8] px-2.5 py-1 text-[9px] font-bold text-[#5d4786]">Relato recebido</span>
              </div>
              <div className="bg-[#f8f6fa] px-3 py-4">
                <div className="relative mx-auto aspect-[3/4] max-w-[230px] overflow-hidden rounded-2xl bg-black shadow-[0_16px_34px_-20px_rgba(0,0,0,0.75)] ring-1 ring-black/10">
                  <video controls playsInline preload="none" poster={feedbackVideoTwoPoster} controlsList="nodownload" aria-label="Relato em vídeo de uma família acolhida" className="block h-full w-full bg-black object-cover">
                    <source src={feedbackVideoTwo} type="video/mp4" />
                    Seu navegador não oferece suporte à reprodução deste vídeo.
                  </video>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[#e5daf0] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#f0eaf5] px-4 py-3 text-left">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#5d4786]">Relato em vídeo</span>
                  <strong className="mt-0.5 block text-sm text-[#241535]">Carta recebida e compartilhada com o Templo</strong>
                </div>
                <span className="rounded-full bg-[#f2eef8] px-2.5 py-1 text-[9px] font-bold text-[#5d4786]">Relato recebido</span>
              </div>
              <div className="bg-[#f8f6fa] px-3 py-4">
                <div className="relative mx-auto aspect-[3/4] max-w-[230px] overflow-hidden rounded-2xl bg-black shadow-[0_16px_34px_-20px_rgba(0,0,0,0.75)] ring-1 ring-black/10">
                  <video controls playsInline preload="none" poster={feedbackVideoThreePoster} controlsList="nodownload" aria-label="Novo relato em vídeo de uma família acolhida" className="block h-full w-full bg-black object-cover">
                    <source src={feedbackVideoThree} type="video/mp4" />
                    Seu navegador não oferece suporte à reprodução deste vídeo.
                  </video>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {feedbackImages.map((feedback, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[#e5daf0] bg-white shadow-sm"
              >
                <img
                  src={feedback.src}
                  alt={feedback.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full block object-contain"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10.5px] font-bold text-[#5e4b73]">
            <span className="rounded-full bg-[#f6f0fc] px-3 py-1.5">Relatos compartilhados</span>
            <span className="rounded-full bg-[#f6f0fc] px-3 py-1.5">Mensagens recebidas</span>
            <span className="rounded-full bg-[#f6f0fc] px-3 py-1.5">Acolhimento pelo WhatsApp</span>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
