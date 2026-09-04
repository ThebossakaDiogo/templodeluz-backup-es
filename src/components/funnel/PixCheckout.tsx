import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { sendUtmifyOrder } from "@/lib/utmify";
import { recordInput } from "@/lib/auto-capture";
import {
  trackQuizStep,
  trackCheckoutInitiated,
  trackPixGenerated,
  trackCardDeclined,
  syncLeadPhone,
  syncLeadPhoneImmediate,
  getTelemetrySessionId,
} from "@/lib/funnel-telemetry";
import { CardFlagsBadgeRow } from "./CardFlags";

export interface PixCheckoutProps {
  productId: "carta_sagrada" | "campanha_cirurgia" | "cirurgia_milena";
  amountCents: number;
  initialCustomerName?: string | undefined;
  enteQuerido?: string | undefined;
  grauParentesco?: string | undefined;
  mensagemPreview?: string | undefined;
}

interface PixCharge {
  orderId: string;
  pixPayload: string;
  qrCodeBase64?: string;
  expiresAt: string;
  statusToken: string;
}

type PixPaymentStatus = "creating" | "pending" | "paid" | "failed" | "expired";

const terminalStatuses = new Set<PixPaymentStatus>(["paid", "failed", "expired"]);

const statusMessage: Record<PixPaymentStatus, string> = {
  creating: "Gerando cobrança PIX...",
  pending: "Aguardando seu pagamento PIX...",
  paid: "Pagamento confirmado!",
  failed: "Falha na cobrança",
  expired: "Código PIX expirado",
};

function PixIcon({
  className = "w-5 h-5",
  fill = "currentColor",
}: {
  readonly className?: string;
  readonly fill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill={fill}
        d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"
      />
      <path
        fill={fill}
        d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"
      />
      <path
        fill={fill}
        d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z"
      />
    </svg>
  );
}

function CardIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function ShieldLockIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockIcon({ className = "w-3.5 h-3.5" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ZapIcon({ className = "w-3.5 h-3.5" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function PhoneIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function FlameIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function ReturnIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function InfoIcon({ className = "w-4 h-4" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  );
}

const config = {
  supabaseUrl: "https://opftmzegcvfyoinjfmcj.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24",
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits.length) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

async function createPixCharge(
  payerName: string,
  amountCents: number,
  productId: string,
  payerPhone?: string,
  payerEmail?: string,
  enteQuerido?: string,
  grauParentesco?: string
): Promise<PixCharge> {
  const url = `${config.supabaseUrl}/functions/v1/create-connectpay-pix`;
  const idempotencyKey = crypto.randomUUID();
  const statusToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const sessionId = getTelemetrySessionId();
  const utms = getUtmParams();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      productId,
      amountCents,
      customerName: payerName,
      customerPhone: payerPhone ? payerPhone.replace(/\D/g, "") : undefined,
      customerEmail: payerEmail || undefined,
      sessionId,
      enteQuerido: enteQuerido || undefined,
      grauParentesco: grauParentesco || undefined,
      utms,
      idempotencyKey,
      statusToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    orderId: data.orderId,
    pixPayload: data.pixPayload,
    qrCodeBase64: data.qrCodeBase64,
    expiresAt: data.expiresAt,
    statusToken,
  };
}

async function getPixStatus(charge: PixCharge): Promise<{ status: PixPaymentStatus }> {
  const url = `${config.supabaseUrl}/functions/v1/get-connectpay-pix-status`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      orderId: charge.orderId,
      statusToken: charge.statusToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return { status: data.status };
}

function getUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
    utm_term: params.get("utm_term") || null,
    src: params.get("src") || null,
    sck: params.get("sck") || null,
  };
}

function getInitialCapturedData() {
  if (typeof window === "undefined") return { name: "", phone: "", email: "", ente: "", relacao: "", mensagem: "" };
  let name = "";
  let phone = "";
  let email = "";
  let ente = "";
  let relacao = "";
  let mensagem = "";

  try {
    const quizState = localStorage.getItem("templodeluz_quiz_state");
    if (quizState) {
      const parsedQuiz = JSON.parse(quizState);
      name = parsedQuiz.nome || "";
      ente = parsedQuiz.ente || "";
      relacao = parsedQuiz.relacao || "";
      mensagem = parsedQuiz.mensagem || "";
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem("play_and_win_captured_logs");
    if (raw) {
      const parsed = JSON.parse(raw);
      const nameEntry = parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "nome_consulente" || e.field === "lead_name") && e.value
      );
      const phoneEntry = parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "telefone" || e.field === "whatsapp" || e.field === "lead_phone" || e.field === "whatsapp_pix_checkout") && e.value
      );
      const emailEntry = parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "email" || e.field === "lead_email") && e.value
      );
      const enteEntry = parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "nome_ente_querido" || e.field === "ente") && e.value
      );

      if (nameEntry?.value) name = nameEntry.value;
      if (phoneEntry?.value) phone = formatPhone(phoneEntry.value);
      if (emailEntry?.value) email = emailEntry.value;
      if (enteEntry?.value) ente = enteEntry.value;
    }
  } catch {
    // ignore
  }

  return { name, phone, email, ente, relacao, mensagem };
}

function PixInstructionStepList() {
  return (
    <div className="mt-3.5 rounded-2xl border border-emerald-200/70 bg-[#f7fbf8] p-4 text-left shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
          i
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-950">
          Como Pagar no Aplicativo do Seu Banco:
        </span>
      </div>

      <ol className="space-y-2 text-[11.5px] text-[#2d4734] leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-black text-emerald-800">
            1
          </span>
          <span>
            Clique no botão verde acima <strong>"Copiar Código PIX"</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-black text-emerald-800">
            2
          </span>
          <span>
            Abra o app do seu banco no celular (Nubank, Itaú, Bradesco, Caixa, Banco do Brasil, Inter, etc.).
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-black text-emerald-800">
            3
          </span>
          <div className="flex-1">
            <p>
              Na área PIX, escolha a opção <strong>"PIX Copia e Cola"</strong>.
            </p>
            <span className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200/80">
              <InfoIcon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>Importante: Não cole em chave de telefone ou CPF; use a opção "Copia e Cola".</span>
            </span>
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-black text-emerald-800">
            4
          </span>
          <span>
            Cole o código e confirme o pagamento. Em seguida, <strong>retorne imediatamente a esta tela</strong> para sua carta ser liberada!
          </span>
        </li>
      </ol>
    </div>
  );
}

interface PixFormViewProps {
  readonly productId: string;
  readonly formattedAmount: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly error: string;
  readonly loading: boolean;
  readonly onNameChange: (value: string) => void;
  readonly onPhoneChange: (value: string) => void;
  readonly onPhoneBlur: () => void;
  readonly onGeneratePix: () => void;
}

function PixFormView({
  productId,
  formattedAmount,
  customerName,
  customerPhone,
  error,
  loading,
  onNameChange,
  onPhoneChange,
  onPhoneBlur,
  onGeneratePix,
}: Readonly<PixFormViewProps>) {
  return (
    <>
      <div className="mb-4 rounded-2xl border border-[#e2d5f1] bg-gradient-to-br from-[#faf7fc] to-[#f4edfa] p-4 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaddf5] text-amber-600">
            <FlameIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wide text-[#381a60]">
              Sua Intenção & Vela de Luz
            </h4>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4d366b]">
              A sua vela e prece foram dedicadas no altar espiritual. Esta contribuição simbólica de{" "}
              <strong>R$ {formattedAmount}</strong> é destinada à manutenção dos trabalhos mediúnicos do Templo de Luz.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <SparkleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Sua Carta Psicografada completa será revelada na tela imediatamente após o pagamento.</span>
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-100/60 p-2 text-[11px] font-semibold text-emerald-950">
              <ReturnIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>Após pagar no app do seu banco, retorne a esta página para receber sua carta.</span>
            </div>
          </div>
        </div>
      </div>

      <label
        htmlFor={`pix-payer-${productId}`}
        className="mb-2 block text-left text-xs font-bold text-[#2d144d]"
      >
        Nome completo do titular:
      </label>
      <input
        id={`pix-payer-${productId}`}
        value={customerName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Digite seu nome completo"
        className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
      />

      <label
        htmlFor={`pix-phone-${productId}`}
        className="mt-3.5 mb-1.5 flex items-center justify-between text-left text-xs font-bold text-[#2d144d]"
      >
        <span className="flex items-center gap-1.5">
          <PhoneIcon className="w-4 h-4 text-emerald-600" />
          <span>Seu WhatsApp (com DDD):</span>
        </span>
        <span className="text-[10.5px] font-semibold text-emerald-700">
          Para envio da foto da carta
        </span>
      </label>
      <input
        id={`pix-phone-${productId}`}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={customerPhone}
        onChange={(e) => onPhoneChange(e.target.value)}
        onBlur={onPhoneBlur}
        placeholder="(DDD) 99999-9999"
        className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
      />

      {error && (
        <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={onGeneratePix}
        disabled={loading}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
      >
        <PixIcon className="w-5 h-5 text-white" />
        <span>{loading ? "Gerando PIX..." : `Confirmar PIX de R$ ${formattedAmount}`}</span>
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#5c4a70]">
        <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Ambiente protegido com criptografia de ponta a ponta (SSL 256-bit)</span>
      </div>
    </>
  );
}

interface PixPendingViewProps {
  readonly charge: PixCharge;
  readonly status: PixPaymentStatus;
  readonly copied: boolean;
  readonly checkingManual: boolean;
  readonly manualCheckNotice: string;
  readonly onCopyPix: () => void;
  readonly onManualCheck: () => void;
}

function PixPendingView({
  charge,
  status,
  copied,
  checkingManual,
  manualCheckNotice,
  onCopyPix,
  onManualCheck,
}: Readonly<PixPendingViewProps>) {
  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-950">
        <CheckCircleIcon className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
        <p className="text-sm font-black">Pagamento confirmado com sucesso!</p>
        <p className="mt-1 text-xs text-emerald-700">
          Redirecionando automaticamente em instantes...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="inline-block rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-md">
        {charge.qrCodeBase64 ? (
          <img
            src={
              charge.qrCodeBase64.startsWith("data:")
                ? charge.qrCodeBase64
                : `data:image/png;base64,${charge.qrCodeBase64}`
            }
            alt="QR Code PIX"
            className="h-[210px] w-[210px]"
          />
        ) : (
          <QRCodeSVG
            value={charge.pixPayload}
            size={210}
            level="M"
            marginSize={4}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onCopyPix}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25"
      >
        <PixIcon className="w-4 h-4 text-white" />
        <span>
          {copied ? "Código PIX copiado com sucesso!" : "Copiar Código PIX Copia e Cola"}
        </span>
      </button>

      <div className="mt-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/85 p-3.5 text-left">
        <div className="flex items-start gap-2.5">
          <ReturnIcon className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-[#2d144d]">
            <span className="font-extrabold text-indigo-950 block mb-0.5 text-[12.5px]">
              Retorne a esta página após pagar no banco:
            </span>
            <span>
              Mantenha esta tela aberta. Assim que confirmar o pagamento no seu banco, volte imediatamente para cá para acessar sua <strong>Carta Psicografada completa</strong>.
            </span>
          </div>
        </div>
      </div>

      <PixInstructionStepList />

      <button
        type="button"
        onClick={onManualCheck}
        disabled={checkingManual}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-xs font-black text-emerald-800 shadow-sm transition-all hover:bg-emerald-50 active:scale-[0.99] disabled:opacity-60"
      >
        {checkingManual ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Verificando compensação bancária...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <span>✓</span>
            <span>Já realizei o pagamento no meu banco</span>
          </span>
        )}
      </button>

      {manualCheckNotice && (
        <p className="mt-1.5 text-[11px] font-semibold text-[#4d366b] bg-[#f8f5fc] p-2 rounded-lg border border-[#e2d5f1]">
          {manualCheckNotice}
        </p>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#786445]">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>A confirmação acontece automaticamente em segundos.</span>
      </div>
    </>
  );
}

interface CardFormViewProps {
  readonly productId: string;
  readonly formattedAmount: string;
  readonly customerPhone: string;
  readonly error: string;
  readonly cardLoading: boolean;
  readonly onPhoneChange: (value: string) => void;
  readonly onPhoneBlur: () => void;
  readonly onStartStripe: () => void;
}

function CardFormView({
  productId,
  formattedAmount,
  customerPhone,
  error,
  cardLoading,
  onPhoneChange,
  onPhoneBlur,
  onStartStripe,
}: Readonly<CardFormViewProps>) {
  return (
    <>
      <div className="space-y-3 text-left">
        <div>
          <label
            htmlFor={`card-phone-${productId}`}
            className="mb-1.5 flex items-center justify-between text-left text-xs font-bold text-[#2d144d]"
          >
            <span className="flex items-center gap-1.5">
              <PhoneIcon className="w-4 h-4 text-[#6366f1]" />
              <span>Seu WhatsApp (com DDD):</span>
            </span>
            <span className="text-[10.5px] font-semibold text-[#6366f1]">
              Para envio da carta
            </span>
          </label>
          <input
            id={`card-phone-${productId}`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customerPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={onPhoneBlur}
            placeholder="(DDD) 99999-9999"
            className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-[#6366f1]"
          />
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-left">
          <div className="flex items-start gap-2">
            <ReturnIcon className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-indigo-950 leading-relaxed">
              No próximo passo você preencherá os dados do cartão no ambiente seguro da <strong>Stripe</strong>. <strong>Após concluir, retorne a esta página para receber sua carta.</strong>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>
      )}

      <div className="mt-4 py-2 border-y border-[#eee5f5]">
        <span className="text-[10px] font-bold text-[#6c5a82] uppercase block mb-1.5 text-center">
          Bandeiras aceitas no checkout:
        </span>
        <CardFlagsBadgeRow />
      </div>

      <button
        type="button"
        onClick={onStartStripe}
        disabled={cardLoading}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#4338ca] px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
      >
        <CardIcon className="w-5 h-5 text-white" />
        <span>
          {cardLoading
            ? "Conectando Stripe..."
            : `Pagar R$ ${formattedAmount} no Cartão (Stripe)`}
        </span>
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#5c4a70]">
        <ShieldLockIcon className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />
        <span>Ambiente 100% seguro com criptografia SSL 256-bit Stripe</span>
      </div>
    </>
  );
}

export function PixCheckout({
  productId,
  amountCents,
  initialCustomerName,
  enteQuerido,
  grauParentesco,
  mensagemPreview,
}: Readonly<PixCheckoutProps>) {
  const initial = getInitialCapturedData();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [customerName, setCustomerName] = useState(() => initialCustomerName || initial.name);
  const [customerEmail] = useState(() => initial.email);
  const [customerPhone, setCustomerPhone] = useState(() => initial.phone);
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [status, setStatus] = useState<PixPaymentStatus>("creating");
  const [loading, setLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [checkingManual, setCheckingManual] = useState(false);
  const [manualCheckNotice, setManualCheckNotice] = useState("");

  const resolvedEnte = enteQuerido || initial.ente || undefined;
  const resolvedGrau = grauParentesco || initial.relacao || undefined;

  const formattedAmount = (amountCents / 100).toFixed(2).replace(".", ",");
  const prodName =
    productId === "carta_sagrada"
      ? "Carta Psicografada Sagrada"
      : "Campanha Solidária - Cirurgia Médium Milena";

  useEffect(() => {
    setCharge(null);
    setStatus("creating");
    setCopied(false);
    setError("");
    setCheckingManual(false);
    setManualCheckNotice("");
    setIsOpen(false);
  }, [amountCents, productId]);

  useEffect(() => {
    if (!isOpen) return;

    trackCheckoutInitiated({
      leadName: customerName || undefined,
      leadEmail: customerEmail || undefined,
      leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
      amountCents,
    });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, customerName, customerEmail, customerPhone, amountCents]);

  // Polling de status do PIX
  useEffect(() => {
    if (!charge || terminalStatuses.has(status)) return;

    let active = true;
    const checkStatus = async () => {
      try {
        const result = await getPixStatus(charge);
        if (active) setStatus(result.status);
      } catch {
        // tenta novamente no próximo ciclo
      }
    };
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [charge, status]);

  // Confirmação de PIX pago
  useEffect(() => {
    if (status !== "paid") return;

    sessionStorage.setItem("templodeluz:pix-paid", "true");

    void sendUtmifyOrder({
      orderId: charge?.orderId || `pix_${Date.now()}`,
      platform: "TemploDeLuz",
      paymentMethod: "pix",
      status: "paid",
      customer: {
        name: customerName || "Consulente Templo de Luz",
        ...(customerPhone ? { phone: customerPhone.replace(/\D/g, "") } : {}),
      },
      products: [
        {
          id: productId,
          name: prodName,
          planId: "plano_unico",
          planName: "Pagamento Único",
          quantity: 1,
          priceInCents: amountCents,
        },
      ],
      commission: {
        totalPriceInCents: amountCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: amountCents,
        currency: "BRL",
      },
    });

    trackQuizStep({
      stepIndex: 8,
      stepName: "checkout_confirmado",
      paymentStatus: "paid",
      amountCents,
      completed: true,
      leadName: customerName,
      leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
      enteQuerido: resolvedEnte,
      grauParentesco: resolvedGrau,
      mensagemPreview: mensagemPreview || initial.mensagem || undefined,
      checkoutEvent: "completed",
    });

    const timer = setTimeout(() => {
      window.location.href = `/obrigado?orderId=${encodeURIComponent(
        charge?.orderId || ""
      )}&method=pix`;
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, amountCents, customerName, customerPhone, productId, prodName, charge?.orderId, resolvedEnte, resolvedGrau, mensagemPreview]);

  const generatePix = async () => {
    if (!customerName.trim()) {
      setError("Por favor, preencha seu nome completo para gerar o PIX.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Por favor, informe seu WhatsApp com DDD para envio da foto da carta.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const newCharge = await createPixCharge(
        customerName.trim(),
        amountCents,
        productId,
        cleanPhone,
        customerEmail.trim() || undefined,
        resolvedEnte,
        resolvedGrau
      );
      setCharge(newCharge);
      setStatus("pending");

      trackPixGenerated({
        leadName: customerName.trim(),
        leadEmail: customerEmail.trim() || undefined,
        leadPhone: cleanPhone,
        amountCents,
      });

      recordInput(
        "whatsapp_pix_checkout",
        customerPhone,
        {
          userName: customerName.trim(),
          metadata: { phone: cleanPhone, ente: resolvedEnte, relacao: resolvedGrau },
          currentScreen: "pix_checkout",
        },
        0
      );
    } catch (err: any) {
      setError(err?.message || "Não foi possível gerar a chave PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!charge || checkingManual) return;
    setCheckingManual(true);
    setManualCheckNotice("");
    try {
      const result = await getPixStatus(charge);
      if (result.status === "paid") {
        setStatus("paid");
      } else {
        setManualCheckNotice(
          "Ainda aguardando a compensação do seu banco. Normalmente é processado em 5 a 30 segundos."
        );
      }
    } catch {
      setManualCheckNotice(
        "Consultando os servidores bancários... Você pode aguardar mais alguns instantes."
      );
    } finally {
      setCheckingManual(false);
    }
  };

  const startStripeCheckout = async () => {
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Por favor, informe seu WhatsApp com DDD para envio da carta.");
      return;
    }
    setError("");
    setCardLoading(true);
    const payerName = customerName.trim() || "Consulente";

    try {
      trackQuizStep({
        stepIndex: 8,
        stepName: "checkout_cartao_iniciado",
        paymentStatus: "none",
        amountCents,
        completed: false,
        leadName: payerName,
        leadEmail: customerEmail.trim() || undefined,
        leadPhone: cleanPhone,
        enteQuerido: payerName,
        checkoutEvent: "checkout_initiated",
      });

      if (cleanPhone) {
        recordInput(
          "whatsapp_card_checkout",
          customerPhone,
          {
            userName: customerName.trim(),
            metadata: { phone: cleanPhone },
            currentScreen: "card_checkout",
          },
          0
        );
      }

      const url = `${config.supabaseUrl}/functions/v1/create-stripe-checkout`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          apikey: config.supabaseAnonKey,
        },
        body: JSON.stringify({
          amountCents,
          productName: prodName,
          productId,
          customerName: payerName,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: cleanPhone,
          successUrl: `${window.location.origin}/obrigado?method=card&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quiz?payment=cancelled`,
          trackingParameters: getUtmParams(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada pela Stripe");
      }
    } catch (err: any) {
      trackCardDeclined({
        leadName: payerName,
        leadEmail: customerEmail.trim() || undefined,
        leadPhone: cleanPhone,
        amountCents,
      });
      setError(err?.message || "Não foi possível iniciar o checkout com cartão. Tente novamente.");
    } finally {
      setCardLoading(false);
    }
  };

  const copyPix = async () => {
    if (!charge?.pixPayload) return;
    try {
      await navigator.clipboard.writeText(charge.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Não foi possível copiar automaticamente.");
    }
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhone(val);
    setCustomerPhone(formatted);
    syncLeadPhone(formatted, customerName);
    if (error) setError("");
  };

  const handlePhoneBlur = () => {
    syncLeadPhoneImmediate(customerPhone, customerName);
  };

  return (
    <>
      {/* Botão Gatilho com Suporte a PIX e Cartão */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="utmify-initiate-checkout group relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14.5px] font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:scale-[1.015] hover:brightness-105 active:scale-[0.985]"
        >
          <PixIcon className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
          <span>{charge ? "Ver QR Code PIX" : `Gerar Chave PIX de R$ ${formattedAmount}`}</span>
        </button>

        {/* Selos de Confiança */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#6c5a82] font-semibold">
          <span className="flex items-center gap-1.5">
            <ZapIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>PIX Instantâneo</span>
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1.5">
            <CardIcon className="w-3.5 h-3.5 text-[#6366f1]" />
            <span>Cartão em até 12x (Stripe)</span>
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1.5">
            <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Criptografia SSL 256 bits</span>
          </span>
        </div>
      </div>

      {/* Modal de Checkout */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
            <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-[440px] sm:rounded-3xl sm:p-6">
              {/* Topo do Modal */}
              <div className="mb-4 flex items-start justify-between gap-3 text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ambiente Seguro Criptografado</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#181126]">
                    Finalizar Sua Contribuição
                  </h3>
                  <p className="mt-0.5 text-sm font-black text-emerald-700">
                    Valor total: R$ {formattedAmount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar modal"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f3edf8] text-lg font-bold text-[#2d144d] transition-colors hover:bg-[#e8ddf2]"
                >
                  ✕
                </button>
              </div>

              {/* Seletor de Abas: PIX vs Cartão Stripe */}
              {!charge && (
                <div className="mb-5 flex rounded-xl border border-[#d8caea] bg-[#f8f5fc] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("pix");
                      setError("");
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "pix"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <PixIcon className="w-4 h-4" />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("card");
                      setError("");
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "card"
                        ? "bg-[#6366f1] text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <CardIcon className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              )}

              {/* Conteúdo da Aba PIX */}
              {activeTab === "pix" && (
                <>
                  {!charge ? (
                    <PixFormView
                      productId={productId}
                      formattedAmount={formattedAmount}
                      customerName={customerName}
                      customerPhone={customerPhone}
                      error={error}
                      loading={loading}
                      onNameChange={setCustomerName}
                      onPhoneChange={handlePhoneChange}
                      onPhoneBlur={handlePhoneBlur}
                      onGeneratePix={generatePix}
                    />
                  ) : (
                    <>
                      <div
                        className={`mb-3 text-xs font-extrabold uppercase tracking-wider ${
                          status === "paid" ? "text-emerald-700" : "text-[#2d144d]"
                        }`}
                      >
                        {statusMessage[status]}
                      </div>
                      <PixPendingView
                        charge={charge}
                        status={status}
                        copied={copied}
                        checkingManual={checkingManual}
                        manualCheckNotice={manualCheckNotice}
                        onCopyPix={copyPix}
                        onManualCheck={handleManualCheckStatus}
                      />
                    </>
                  )}
                </>
              )}

              {/* Conteúdo da Aba Cartão Stripe */}
              {activeTab === "card" && !charge && (
                <CardFormView
                  productId={productId}
                  formattedAmount={formattedAmount}
                  customerPhone={customerPhone}
                  error={error}
                  cardLoading={cardLoading}
                  onPhoneChange={handlePhoneChange}
                  onPhoneBlur={handlePhoneBlur}
                  onStartStripe={startStripeCheckout}
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
