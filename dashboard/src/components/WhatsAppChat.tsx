import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronLeft,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  Image,
  MessageCircle,
  PackageCheck,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import type { DashboardProfileId } from "@/lib/dashboard-profiles";
import { createWhatsAppChatClient, type WhatsAppEvolutionConnect, type WhatsAppEvolutionStatus } from "@/services/whatsapp-chat";
import type {
  WhatsAppAiRun,
  WhatsAppAiSettings,
  WhatsAppChatMessage,
  WhatsAppChatThread,
  WhatsAppMaterial,
  WhatsAppThreadStatus,
} from "@/types";

interface WhatsAppChatProps {
  readonly profile: DashboardProfileId;
  readonly accessToken: string | undefined;
  readonly onUnreadCountChange?: (count: number) => void;
}

const DEFAULT_AI_SETTINGS: WhatsAppAiSettings = {
  enabled: false,
  brand_instructions: "",
  tone: "acolhedor e objetivo",
  away_message: null,
  response_window_minutes: 15,
  message_limit: 3,
  updated_at: null,
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatThreadDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? formatTime(value)
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function initials(name: string | null): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function materialIcon(mimeType: string) {
  return mimeType.startsWith("image/") ? <Image /> : <FileText />;
}

function quickReplies(thread: WhatsAppChatThread) {
  const firstName = thread.customer_name?.trim().split(/\s+/)[0] || "tudo bem";
  const ente = thread.ente_querido ? ` sobre ${thread.ente_querido}` : "";
  return [
    {
      title: "Boas-vindas",
      description: "Receber e acolher",
      icon: <MessageCircle />,
      content: `Olá, ${firstName}! Aqui é a equipe da Milena. Recebemos sua mensagem${ente} e vamos acompanhar você por aqui com todo cuidado.`,
    },
    {
      title: "Próximos passos",
      description: "Orientar o atendimento",
      icon: <ClipboardCheck />,
      content: `Olá, ${firstName}. Para seguirmos com seu atendimento, confirme por favor seu nome completo e o nome da pessoa homenageada. Em seguida, orientaremos os próximos passos.`,
    },
    {
      title: "Pagamento",
      description: thread.payment_status === "paid" ? "Confirmado" : "Solicitar comprovante",
      icon: <CreditCard />,
      content: thread.payment_status === "paid"
        ? `Olá, ${firstName}! Seu pagamento está confirmado. Vamos dar continuidade ao atendimento e manter você informado(a) por este WhatsApp.`
        : `Olá, ${firstName}. Quando concluir o pagamento, envie o comprovante por aqui para conferirmos e continuarmos seu atendimento.`,
    },
    {
      title: "Entrega da carta",
      description: "Confirmar preparação",
      icon: <PackageCheck />,
      content: `Olá, ${firstName}! Sua solicitação de carta está em acompanhamento. Assim que a preparação avançar, enviaremos a atualização e as orientações de entrega por aqui.`,
    },
    {
      title: "Agendamento",
      description: "Combinar data e horário",
      icon: <CalendarClock />,
      content: `Olá, ${firstName}! Vamos organizar seu atendimento com a Milena. Informe os melhores dias e se prefere horário durante o dia ou à noite.`,
    },
  ];
}

export function WhatsAppChat({ profile, accessToken, onUnreadCountChange }: WhatsAppChatProps) {
  const client = useMemo(
    () => createWhatsAppChatClient(profile, accessToken),
    [profile, accessToken]
  );
  const [threads, setThreads] = useState<WhatsAppChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<WhatsAppChatThread | null>(null);
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [materials, setMaterials] = useState<WhatsAppMaterial[]>([]);
  const [aiSettings, setAiSettings] = useState<WhatsAppAiSettings>(DEFAULT_AI_SETTINGS);
  const [aiRuns, setAiRuns] = useState<WhatsAppAiRun[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | WhatsAppThreadStatus>("open");
  const [composer, setComposer] = useState("");
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<WhatsAppEvolutionStatus | null>(null);
  const [evolutionQr, setEvolutionQr] = useState<WhatsAppEvolutionConnect | null>(null);
  const [connectingEvolution, setConnectingEvolution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const loadSelectedThread = useCallback(async (thread: WhatsAppChatThread) => {
    setThreadLoading(true);
    setError(null);
    try {
      const [nextMessages, nextRuns] = await Promise.all([
        client.listMessages(thread.id),
        client.listAiRuns(thread.id),
      ]);
      setMessages(nextMessages);
      setAiRuns(nextRuns);
      window.setTimeout(() => {
        messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
      }, 0);
    } catch (err) {
      setMessages([]);
      setAiRuns([]);
      setError(err instanceof Error ? err.message : "Não foi possível carregar a conversa.");
    } finally {
      setThreadLoading(false);
    }
  }, [client]);

  const reload = useCallback(async (preserveSelection = true) => {
    setLoading(true);
    setError(null);
    try {
      const [threadResult, nextMaterials, nextAiSettings] = await Promise.all([
        client.listThreads(),
        client.listMaterials(),
        client.getAiSettings(),
      ]);
      setThreads(threadResult.threads);
      onUnreadCountChange?.(threadResult.threads.filter((thread) => thread.unread_count > 0).length);
      setMaterials(nextMaterials);
      setAiSettings(nextAiSettings);
      void client.getEvolutionStatus().then(setEvolutionStatus).catch(() => {
        setEvolutionStatus({ configured: false, connected: false, state: "unavailable" });
      });
      setSelectedThread((current) => {
        if (preserveSelection && current) {
          return threadResult.threads.find((thread) => thread.id === current.id) ?? null;
        }
        return threadResult.threads[0] ?? null;
      });
    } catch (err) {
      setThreads([]);
      setMaterials([]);
      onUnreadCountChange?.(0);
      setError(err instanceof Error ? err.message : "Não foi possível carregar o WhatsApp Chat.");
    } finally {
      setLoading(false);
    }
  }, [client, onUnreadCountChange]);

  const handleConnectEvolution = async () => {
    if (connectingEvolution) return;
    setConnectingEvolution(true);
    setError(null);
    try {
      const result = await client.connectEvolution();
      setEvolutionStatus(result);
      setEvolutionQr(result);
      if (result.connected) setNotice(`WhatsApp conectado na instância ${result.instance}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível conectar o WhatsApp na nuvem.");
    } finally {
      setConnectingEvolution(false);
    }
  };

  useEffect(() => {
    void reload(false);
  }, [profile, reload]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      setAiRuns([]);
      return;
    }
    void loadSelectedThread(selectedThread);
  }, [loadSelectedThread, selectedThread?.id]);

  useEffect(() => {
    // Polling mantém o inbox atualizado mesmo em redes que bloqueiam WebSocket/Realtme.
    const refreshInbox = () => {
      void reload();
      if (selectedThread) void loadSelectedThread(selectedThread);
    };
    const interval = window.setInterval(refreshInbox, 12_000);
    return () => window.clearInterval(interval);
  }, [loadSelectedThread, reload, selectedThread]);

  useEffect(() => {
    if (!evolutionQr || evolutionStatus?.connected) return;
    let cancelled = false;
    const checkConnection = async () => {
      try {
        const next = await client.getEvolutionStatus();
        if (cancelled) return;
        setEvolutionStatus(next);
        if (next.connected) {
          setEvolutionQr(null);
          setNotice(`WhatsApp conectado na instância ${next.instance}. O inbox já está pronto.`);
          void reload();
        }
      } catch {
        // O QR permanece visível e uma nova tentativa ocorre automaticamente.
      }
    };
    const interval = window.setInterval(() => void checkConnection(), 3_000);
    void checkConnection();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [client, evolutionQr, evolutionStatus?.connected, reload]);

  const handleSelectThread = (thread: WhatsAppChatThread) => {
    setSelectedThread(thread);
    setComposer("");
    setNotice(null);
  };

  const handleSend = async () => {
    if (!selectedThread || !composer.trim() || sending) return;
    const content = composer.trim();
    setSending(true);
    setError(null);
    try {
      await client.sendText({ thread: selectedThread, content });
      setComposer("");
      setNotice("Mensagem enviada e registrada na conversa.");
      await Promise.all([reload(), loadSelectedThread(selectedThread)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A mensagem não foi enviada.");
    } finally {
      setSending(false);
    }
  };

  const handleThreadStatus = async (nextStatus: WhatsAppThreadStatus) => {
    if (!selectedThread) return;
    setError(null);
    try {
      await client.updateThread(selectedThread.id, nextStatus);
      setNotice(nextStatus === "resolved" ? "Conversa marcada como resolvida." : "Conversa reaberta.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a conversa.");
    }
  };

  const handleToggleAutomation = async () => {
    const enabled = !aiSettings.enabled;
    if (enabled && !window.confirm("A automação responderá futuras mensagens elegíveis deste perfil. Continuar?")) return;
    setError(null);
    try {
      const next = await client.updateAiSettings({ ...aiSettings, enabled, ai_enabled: true });
      setAiSettings(next);
      setNotice(enabled ? "Automação IA ativada para este perfil." : "Automação IA desativada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a automação.");
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedThread || generatingDraft) return;
    setGeneratingDraft(true);
    setError(null);
    try {
      if (!aiSettings.ai_enabled) {
        const nextSettings = await client.updateAiSettings({ ...aiSettings, ai_enabled: true });
        setAiSettings(nextSettings);
      }
      const result = await client.generateDraft(selectedThread.id);
      setComposer(result.draft);
      setNotice("Rascunho do Gemini inserido no compositor. Revise antes de enviar.");
      setAiRuns((runs) => (result.run ? [result.run, ...runs] : runs));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o rascunho.");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const material = await client.uploadMaterial({ file, category: "geral", description: "" });
      setMaterials((current) => [material, ...current]);
      setNotice("Material enviado para a biblioteca privada deste perfil.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o material.");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMaterial = async (material: WhatsAppMaterial) => {
    if (!selectedThread || sending) return;
    setSending(true);
    setError(null);
    try {
      await client.sendMaterial({ thread: selectedThread, material });
      setMaterialsOpen(false);
      setNotice(`${material.name} foi enviado e registrado na conversa.`);
      await Promise.all([reload(), loadSelectedThread(selectedThread)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O material não foi enviado.");
    } finally {
      setSending(false);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const normalized = materialSearch.trim().toLowerCase();
    return !normalized || `${material.name} ${material.category || ""} ${material.description || ""}`.toLowerCase().includes(normalized);
  });
  const profileLabel = profile === "meta" ? "Meta" : "TikTok";
  const openThreads = threads.filter((thread) => thread.status === "open").length;
  const unreadThreads = threads.filter((thread) => thread.unread_count > 0).length;
  const visibleThreads = threads.filter((thread) => {
    if (status !== "all" && thread.status !== status) return false;
    const normalizedQuery = query.trim().toLowerCase();
    return !normalizedQuery || `${thread.customer_name || ""} ${thread.customer_phone}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <section className="whatsapp-chat" aria-label={`WhatsApp Chat ${profileLabel}`}>
      <header className="whatsapp-chat-header card">
        <div>
          <span className="whatsapp-chat-kicker"><MessageCircle /> WhatsApp Chat</span>
          <h2>Inbox {profileLabel}</h2>
          <p>Conversas e materiais ficam isolados no perfil selecionado.</p>
        </div>
        <div className="whatsapp-chat-header-actions">
          <div className="whatsapp-chat-stat"><strong><Wifi size={15} /> {evolutionStatus?.connected ? "Online" : "Offline"}</strong><span>{evolutionStatus?.instance || `Instância ${profileLabel}`}</span></div>
          <div className="whatsapp-chat-stat"><strong>{openThreads}</strong><span>abertas</span></div>
          <div className="whatsapp-chat-stat"><strong>{unreadThreads}</strong><span>não lidas</span></div>
          <button type="button" className="btn whatsapp-chat-refresh" onClick={() => void reload()} disabled={loading} aria-label="Atualizar inbox">
            <RefreshCw className={loading ? "spinning" : ""} />
          </button>
          {!evolutionStatus?.connected && <button type="button" className="btn btn-emerald" onClick={() => void handleConnectEvolution()} disabled={connectingEvolution}>{connectingEvolution ? <RefreshCw className="spinning" /> : <Wifi />} Conectar</button>}
          <label className="whatsapp-ai-toggle">
            <input type="checkbox" checked={aiSettings.enabled} onChange={() => void handleToggleAutomation()} />
            <span aria-hidden="true" />
            <b>Automação IA</b>
          </label>
        </div>
      </header>

      {aiSettings.enabled && (
        <div className="whatsapp-chat-warning"><CircleAlert /> Automação ativa: apenas futuras mensagens elegíveis deste perfil poderão receber resposta automática.</div>
      )}
      {error && <div className="whatsapp-chat-error" role="alert"><CircleAlert /> {error}<button type="button" onClick={() => setError(null)} aria-label="Fechar aviso"><X /></button></div>}
      {notice && <div className="whatsapp-chat-notice"><Check /> {notice}<button type="button" onClick={() => setNotice(null)} aria-label="Fechar aviso"><X /></button></div>}
      {evolutionQr && !evolutionStatus?.connected && (
        <section className="card whatsapp-cloud-qr" aria-label="Conectar WhatsApp na nuvem">
          <div className="whatsapp-cloud-qr-copy"><span className="section-kicker">Evolution Railway · 24/7</span><h3>Conecte {evolutionQr.instance}</h3><ol><li>Abra o WhatsApp no celular.</li><li>Entre em <b>Aparelhos conectados</b>.</li><li>Toque em <b>Conectar aparelho</b> e escaneie.</li></ol><p><RefreshCw className="spinning" /> A conexão será detectada automaticamente.</p>{evolutionQr.pairingCode && <strong>Código: {evolutionQr.pairingCode}</strong>}</div>
          <div className="whatsapp-cloud-qr-code">{evolutionQr.base64 ? <img src={evolutionQr.base64.startsWith("data:") ? evolutionQr.base64 : `data:image/png;base64,${evolutionQr.base64}`} alt={`QR Code da instância ${evolutionQr.instance}`} /> : <code>{evolutionQr.code || "QR Code sendo preparado. Clique em atualizar em alguns segundos."}</code>}<small>Mantenha esta tela aberta até aparecer “Online”.</small></div>
        </section>
      )}

      <div className="whatsapp-chat-workspace card">
        <aside className={`whatsapp-thread-list${selectedThread ? " has-selection" : ""}`} aria-label="Lista de conversas">
          <div className="whatsapp-thread-list-head">
            <div className="whatsapp-thread-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void reload(false); }} placeholder="Buscar conversa" aria-label="Buscar conversa" /></div>
            <div className="whatsapp-thread-filters" role="group" aria-label="Filtrar conversas">
              {([ ["open", "Abertas"], ["all", "Todas"], ["resolved", "Resolvidas"] ] as const).map(([value, label]) => (
                <button type="button" key={value} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="whatsapp-thread-list-scroll">
            {loading && <p className="whatsapp-chat-empty">Carregando conversas...</p>}
            {!loading && visibleThreads.length === 0 && <p className="whatsapp-chat-empty">Nenhuma conversa de chat neste perfil.</p>}
            {visibleThreads.map((thread) => (
              <button type="button" key={thread.id} className={`whatsapp-thread${selectedThread?.id === thread.id ? " selected" : ""}`} onClick={() => handleSelectThread(thread)}>
                <span className="whatsapp-thread-avatar">{initials(thread.customer_name)}</span>
                <span className="whatsapp-thread-main">
                  <span className="whatsapp-thread-title"><b>{thread.customer_name || thread.customer_phone}</b><time>{formatThreadDate(thread.last_message_at)}</time></span>
                  <span className="whatsapp-thread-preview">{thread.last_message_content || "Sem mensagem de texto"}</span>
                  <span className="whatsapp-thread-tags"><i className={thread.status}>{thread.status === "resolved" ? "Resolvida" : thread.status === "opted_out" ? "Opt-out" : "Aberta"}</i>{thread.payment_status === "paid" && <i className="paid">Pago</i>}</span>
                </span>
                {thread.unread_count > 0 && <span className="whatsapp-thread-unread">{thread.unread_count > 99 ? "99+" : thread.unread_count}</span>}
              </button>
            ))}
          </div>
        </aside>

        <main className="whatsapp-conversation" aria-live="polite">
          {!selectedThread && !loading && <div className="whatsapp-conversation-empty"><MessageCircle /><h3>Selecione uma conversa</h3><p>As mensagens recebidas pela instância {profileLabel} aparecerão aqui.</p></div>}
          {selectedThread && (
            <>
              <header className="whatsapp-conversation-head">
                <button type="button" className="whatsapp-back-to-threads" onClick={() => setSelectedThread(null)} aria-label="Voltar para conversas"><ChevronLeft /></button>
                <span className="whatsapp-thread-avatar large">{initials(selectedThread.customer_name)}</span>
                <div><h3>{selectedThread.customer_name || selectedThread.customer_phone}</h3><p>{selectedThread.customer_phone}{selectedThread.ente_querido ? ` · ${selectedThread.ente_querido}` : ""}</p></div>
                <div className="whatsapp-conversation-actions">
                  {selectedThread.status === "resolved" ? <button type="button" className="btn" onClick={() => void handleThreadStatus("open")}>Reabrir</button> : <button type="button" className="btn btn-emerald" onClick={() => void handleThreadStatus("resolved")}><CheckCheck /> Resolver</button>}
                </div>
              </header>
              <div className="whatsapp-message-list" ref={messageListRef}>
                {threadLoading && <p className="whatsapp-chat-empty">Carregando mensagens...</p>}
                {!threadLoading && messages.length === 0 && <p className="whatsapp-chat-empty">Ainda não há mensagens nesta conversa.</p>}
                {messages.map((message) => (
                  <article key={message.id} className={`whatsapp-bubble ${message.direction}`}>
                    {message.message_type !== "text" && <span className="whatsapp-bubble-media">{message.message_type === "image" ? <Image /> : <FileText />} {message.media_name || "Material enviado"}</span>}
                    {message.content && <p>{message.content}</p>}
                    <footer><time>{formatTime(message.created_at)}</time>{message.direction !== "inbound" && <span>{message.delivery_status === "failed" ? "Falhou" : <CheckCheck />}</span>}</footer>
                  </article>
                ))}
              </div>
              {aiRuns.length > 0 && <div className="whatsapp-ai-run"><Bot /><span>Gemini: {aiRuns[0].status === "failed" ? aiRuns[0].error || "falha registrada" : aiRuns[0].summary || "execução registrada"}</span></div>}
              <div className="whatsapp-quick-strip" aria-label="Mensagens prontas">
                {quickReplies(selectedThread).map((reply) => <button type="button" key={reply.title} onClick={() => setComposer(reply.content)}>{reply.icon}<span>{reply.title}</span></button>)}
              </div>
              <div className="whatsapp-composer">
                <div className="whatsapp-composer-actions">
                  <button type="button" className="btn" onClick={() => setMaterialsOpen(true)} disabled={sending}><Paperclip /> Material</button>
                  <button type="button" className="btn" onClick={() => void handleGenerateDraft()} disabled={generatingDraft || sending}><Sparkles /> {generatingDraft ? "Gerando..." : "Gerar com Gemini"}</button>
                </div>
                <textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Escreva uma mensagem manual..." rows={3} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void handleSend(); } }} />
                <button type="button" className="btn btn-emerald whatsapp-send" onClick={() => void handleSend()} disabled={!composer.trim() || sending}><Send /> {sending ? "Enviando" : "Enviar"}</button>
              </div>
            </>
          )}
        </main>

        {selectedThread && (
          <aside className="whatsapp-context-panel" aria-label="Dados e mensagens prontas">
            <section className="whatsapp-customer-card">
              <span className="whatsapp-thread-avatar large">{initials(selectedThread.customer_name)}</span>
              <div><span className="section-kicker">Cliente selecionado</span><h3>{selectedThread.customer_name || selectedThread.customer_phone}</h3><p>{selectedThread.customer_phone}</p></div>
              <dl>
                <div><dt>Status</dt><dd>{selectedThread.status === "resolved" ? "Resolvida" : selectedThread.status === "opted_out" ? "Opt-out" : "Em atendimento"}</dd></div>
                <div><dt>Pagamento</dt><dd className={selectedThread.payment_status === "paid" ? "is-paid" : ""}>{selectedThread.payment_status === "paid" ? "Pago" : selectedThread.payment_status === "pending" ? "Pendente" : "Não informado"}</dd></div>
                {selectedThread.ente_querido && <div><dt>Ente querido</dt><dd>{selectedThread.ente_querido}</dd></div>}
              </dl>
            </section>

            <section className="whatsapp-ready-messages">
              <header><div><span className="section-kicker">Atalhos</span><h3>Mensagens prontas</h3></div><small>Clique para editar</small></header>
              <div>
                {quickReplies(selectedThread).map((reply) => (
                  <button type="button" key={reply.title} onClick={() => { setComposer(reply.content); setNotice(`${reply.title} inserida. Revise antes de enviar.`); }}>
                    <span>{reply.icon}</span><b>{reply.title}</b><small>{reply.description}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="whatsapp-side-actions">
              <button type="button" className="btn" onClick={() => setMaterialsOpen(true)}><Paperclip /> Biblioteca de materiais</button>
              <button type="button" className="btn" onClick={() => void handleGenerateDraft()} disabled={generatingDraft}><Sparkles /> Criar resposta com Gemini</button>
            </section>
          </aside>
        )}

        {materialsOpen && (
          <aside className="whatsapp-materials-panel" aria-label="Biblioteca de materiais">
            <header><div><h3>Materiais</h3><p>Biblioteca privada de {profileLabel}</p></div><button type="button" onClick={() => setMaterialsOpen(false)} aria-label="Fechar materiais"><X /></button></header>
            <div className="whatsapp-thread-search"><Search /><input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Buscar material" aria-label="Buscar material" /></div>
            <input ref={fileInputRef} type="file" hidden onChange={(event) => void handleUpload(event)} />
            <button type="button" className="btn whatsapp-upload" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload /> {uploading ? "Enviando..." : "Adicionar material"}</button>
            <div className="whatsapp-material-list">
              {filteredMaterials.length === 0 && <p className="whatsapp-chat-empty">Nenhum material disponível.</p>}
              {filteredMaterials.map((material) => <article key={material.id} className="whatsapp-material"><span>{materialIcon(material.mime_type)}</span><div><b>{material.name}</b><small>{material.category || "Geral"}</small></div><button type="button" className="btn" onClick={() => void handleSendMaterial(material)} disabled={sending || !selectedThread}>Enviar</button></article>)}
            </div>
          </aside>
        )}
      </div>
      <p className="whatsapp-chat-footnote"><Clock3 /> Evolution 24/7 no Railway. Envios passam pelo Supabase do perfil {profileLabel}; o dashboard não recebe chaves Evolution ou Gemini.</p>
    </section>
  );
}
