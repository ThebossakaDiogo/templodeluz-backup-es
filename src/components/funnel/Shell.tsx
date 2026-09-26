import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function Reveal({
  children,
  delay = 0,
  className = "",
  id,
}: Readonly<{
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`${shown ? "reveal-in" : "reveal-hidden"} ${className}`}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function Stars({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      className={`text-gold text-[15px] tracking-[0.7em] opacity-80 select-none ${className}`}
      aria-hidden
    >
      ✦ ✧ ✦
    </div>
  );
}

export function Halos() {
  return (
    <>
      <span className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-accent/15 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-primary-glow/25 blur-2xl" />
    </>
  );
}

export function Card({ children, className = "" }: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#766089]">
      {children}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="mt-0 border-t border-[#e3dbe9] bg-[#f7f3fa] px-6 py-9 text-center text-[12px] font-normal leading-relaxed text-[#766d7d]">
      <div className="font-display text-base font-bold tracking-tight text-[#3a3043]">
        🕊️ Templo de Luz
      </div>
      <p className="mx-auto mt-2.5 max-w-[360px] leading-relaxed text-[#766d7d]">
        Templo de Luz é um projeto de Centro Espírita Casa Nova — associação privada sem fins
        lucrativos.
      </p>
      <div className="mt-2 space-y-0.5 text-[11.5px] font-medium text-[#817687]">
        <p>CNPJ 61.566.220/0001-71</p>
        <p>Rua José Gonçalves Gomide, 144 — Vila Guilherme, São Paulo/SP — CEP 02075-001</p>
      </div>

      <div className="mx-auto my-4 h-px w-20 bg-[#ddd4e4]" />

      <p className="text-[12px] text-[#766d7d]">
        Contato:{" "}
        <a
          className="font-semibold text-[#725b83] hover:underline"
          href="mailto:tempodaluz@gmail.com"
        >
          tempodaluz@gmail.com
        </a>{" "}
        ·{" "}
        <a className="font-semibold text-[#725b83] hover:underline" href="tel:+5511960746285">
          (11) 96074-6285
        </a>
      </p>

      <div className="mt-4 flex items-center justify-center gap-4 text-[12px] font-medium text-[#766d7d]">
        <Link
          to="/privacidade"
          className="underline decoration-[#cfc3d7] underline-offset-4 transition-colors hover:text-[#725b83]"
        >
          Política de Privacidade
        </Link>
        <span>•</span>
        <Link
          to="/termos"
          className="underline decoration-[#cfc3d7] underline-offset-4 transition-colors hover:text-[#725b83]"
        >
          Termos de Uso
        </Link>
      </div>

      {/* Disclaimer de não-afiliação à Meta */}
      <p className="mt-5 mx-auto max-w-[340px] text-[8.5px] leading-[1.4] text-[#b0a3b8] font-normal select-none">
        Este site não é parte, nem é endossado pelo Facebook, Instagram ou Meta Platforms, Inc.
        Todo o conteúdo aqui expresso é de inteira responsabilidade do Templo de Luz / Centro Espírita Casa Nova.
        O Facebook e o Instagram são marcas registradas da Meta Platforms, Inc.
      </p>
    </footer>
  );
}
