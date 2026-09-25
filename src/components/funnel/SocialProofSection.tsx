import { useEffect, useRef, useState } from "react";
import feedbackOne from "../../assets/media/feedbacks/Feedback.webp";
import feedbackTwo from "../../assets/media/feedbacks/Feedback2.webp";
import feedbackVideo from "../../assets/media/feedbacks/Feedback3.mp4";
import feedbackVideoTwo from "../../assets/media/feedbacks/Feedback4.mp4";
import feedbackVideoTwoPoster from "../../assets/media/feedbacks/Feedback4-poster.webp";
import feedbackVideoPoster from "../../assets/media/feedbacks/Feedback3-poster.webp";
import feedbackVideoThree from "../../assets/media/feedbacks/Feedback5.mp4";
import feedbackVideoThreePoster from "../../assets/media/feedbacks/Feedback5-poster.webp";
import feedbackWhatsApp from "../../assets/media/feedbacks/Feedback6-whatsapp.jpg";
import { Reveal } from "./Shell";

type Testimonial = {
  kind: "video" | "image";
  src: string;
  poster?: string;
  title: string;
  alt: string;
};

const testimonials: Testimonial[] = [
  { kind: "video", src: feedbackVideo, poster: feedbackVideoPoster, title: "Relato em vídeo", alt: "Relato em vídeo de uma família acolhida" },
  { kind: "video", src: feedbackVideoTwo, poster: feedbackVideoTwoPoster, title: "Relato compartilhado", alt: "Mensagem em vídeo compartilhada por uma família" },
  { kind: "video", src: feedbackVideoThree, poster: feedbackVideoThreePoster, title: "Carta recebida", alt: "Relato em vídeo de uma carta recebida" },
  { kind: "image", src: feedbackOne, title: "Mensagem recebida", alt: "Relato de agradecimento por carta psicografada recebido via WhatsApp" },
  { kind: "image", src: feedbackTwo, title: "Relato recebido", alt: "Depoimento compartilhado via WhatsApp" },
  { kind: "image", src: feedbackWhatsApp, title: "Mensagem compartilhada", alt: "Novo depoimento recebido via WhatsApp" },
];

export function SocialProofSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = (index: number) => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>("[data-testimonial-card]");
    if (!rail || !card) return;
    const nextIndex = (index + testimonials.length) % testimonials.length;
    rail.scrollTo({ left: nextIndex * (card.offsetWidth + 12), behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  const handleRailScroll = () => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>("[data-testimonial-card]");
    if (!rail || !card) return;
    const index = Math.round(rail.scrollLeft / (card.offsetWidth + 12));
    setActiveIndex(Math.max(0, Math.min(testimonials.length - 1, index)));
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => scrollToIndex(activeIndex + 1), 5_000);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused]);

  return (
    <Reveal className="mb-7">
      <section className="overflow-hidden rounded-3xl border border-[#493859] bg-[#171021] shadow-[0_24px_70px_-36px_rgba(0,0,0,0.9)]">
        <div className="bg-gradient-to-br from-[#2d144d] via-[#3b1c63] to-[#171020] px-5 py-7 text-center text-white sm:px-7 sm:py-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-200">Relatos recebidos pelo Templo</span>
          <h2 className="mx-auto mt-4 max-w-[410px] font-display text-[26px] font-black leading-[1.15] sm:text-[30px]">Histórias compartilhadas por famílias acolhidas</h2>
          <p className="mx-auto mt-3 max-w-[430px] text-[14px] leading-relaxed text-[#e8dff4] sm:text-[15px]">Veja um relato por vez. Deslize para o lado ou use os botões abaixo.</p>
        </div>

        <div className="p-3.5 sm:p-6">
          <div
            ref={railRef}
            onScroll={handleRailScroll}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerCancel={() => setPaused(false)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.map((testimonial, index) => (
              <article data-testimonial-card key={testimonial.src} className="min-w-[calc(100%-4px)] snap-center overflow-hidden rounded-2xl border border-[#59436b] bg-[#100a18] shadow-lg sm:min-w-[calc(100%-4px)]">
                <div className="flex min-h-12 items-center justify-between border-b border-[#493859] bg-[#21172e] px-4 py-3">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f0cf7b]">{testimonial.title}</span>
                  <span className="rounded-full border border-[#59436b] bg-[#2b2039] px-2.5 py-1 text-[10px] font-bold text-[#ddd0e6]">{index + 1} de {testimonials.length}</span>
                </div>
                <div className="aspect-[4/5] bg-[#171020] p-2.5 sm:aspect-[3/4]">
                  {testimonial.kind === "video" ? (
                    <video controls playsInline preload="none" poster={testimonial.poster} controlsList="nodownload" aria-label={testimonial.alt} className="h-full w-full rounded-xl bg-black object-cover">
                      <source src={testimonial.src} type="video/mp4" />
                      Seu navegador não oferece suporte à reprodução deste vídeo.
                    </video>
                  ) : (
                    <img src={testimonial.src} alt={testimonial.alt} loading="lazy" decoding="async" className="h-full w-full rounded-xl bg-white object-contain" />
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-1 flex items-center justify-between gap-3 px-1">
            <button type="button" onClick={() => scrollToIndex(activeIndex - 1)} className="rounded-xl border border-[#59436b] bg-[#21172e] px-3 py-2 text-[12px] font-bold text-[#e7dced] transition-colors hover:border-[#8c6da1] hover:bg-[#2b2039]" aria-label="Ver relato anterior">
              ← Anterior
            </button>
            <div className="flex gap-1.5" aria-label="Navegação dos relatos">
              {testimonials.map((testimonial, index) => (
                <button key={testimonial.src} type="button" onClick={() => scrollToIndex(index)} aria-label={`Ver relato ${index + 1}`} className={`h-2 rounded-full transition-all ${activeIndex === index ? "w-5 bg-[#d9be82]" : "w-2 bg-[#4a3859]"}`} />
              ))}
            </div>
            <button type="button" onClick={() => scrollToIndex(activeIndex + 1)} className="rounded-xl border border-[#59436b] bg-[#21172e] px-3 py-2 text-[12px] font-bold text-[#e7dced] transition-colors hover:border-[#8c6da1] hover:bg-[#2b2039]" aria-label="Ver próximo relato">
              Próximo →
            </button>
          </div>

          <p className="mt-4 text-center text-[12px] leading-relaxed text-[#a998b7]">Relatos são experiências pessoais compartilhadas pelas famílias e não representam promessa de resultado.</p>
        </div>
      </section>
    </Reveal>
  );
}
