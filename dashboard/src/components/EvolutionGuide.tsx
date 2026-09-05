import { useState } from "react";
import { BookOpen, ChevronDown, Copy, ExternalLink, Check } from "lucide-react";
import { EVOLUTION_MANAGER_URL } from "@/services/evolution-local-bridge";

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn guide-copy"
      onClick={() => {
        void navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      title="Copiar comando"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export function EvolutionGuide() {
  const [open, setOpen] = useState<string | null>("passos");

  const sections: GuideSection[] = [
    {
      id: "passos",
      title: "Passo a passo de acesso",
      icon: "🚀",
      content: (
        <ol className="guide-steps">
          <li>
            <strong>Entre no dashboard</strong> com seu usuário administrador e abra a aba{" "}
            <em>Visão Geral</em>.
          </li>
          <li>
            Localize o card <strong>“Evolution API”</strong> e observe os 3 status:{" "}
            <em>Docker</em>, <em>Evolution</em> e <em>WhatsApp</em>.
          </li>
          <li>
            Se estiver <strong>“Offline”</strong>, clique em <strong>“Iniciar Evolution”</strong>.
            O card passa por <em>Iniciando Docker → Iniciando Evolution → Online</em> (1 a 3 min na
            primeira vez).
          </li>
          <li>
            Com a Evolution <strong>Online</strong>, clique em <strong>“Abrir Manager”</strong>.
          </li>
          <li>
            No Manager, abra a instância <strong>dipefy-drop</strong> → <em>Conectar</em> →{" "}
            <em>QR Code</em>.
          </li>
          <li>
            Escaneie com o celular: <em>WhatsApp → Aparelhos conectados → Conectar aparelho</em>.
          </li>
          <li>
            Quando o Manager mostrar <strong>Connected</strong>, volte ao dashboard: o status muda
            para <strong>“WhatsApp conectado”</strong>.
          </li>
        </ol>
      ),
    },
    {
      id: "credenciais",
      title: "Credenciais e endpoints",
      icon: "🔑",
      content: (
        <div className="guide-cred">
          <table className="guide-table">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>API base</td>
                <td>
                  <code>http://127.0.0.1:8080</code>
                </td>
              </tr>
              <tr>
                <td>Manager (painel)</td>
                <td>
                  <a href={EVOLUTION_MANAGER_URL} target="_blank" rel="noreferrer" className="guide-link">
                    {EVOLUTION_MANAGER_URL} <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
              <tr>
                <td>Bridge local (dashboard)</td>
                <td>
                  <code>http://127.0.0.1:3210</code>
                </td>
              </tr>
              <tr>
                <td>Instância (nome)</td>
                <td>
                  <code>dipefy-drop</code>
                </td>
              </tr>
              <tr>
                <td>API Key</td>
                <td>
                  Fica apenas em <code>C:\evolution-local\.env</code> (variável{" "}
                  <code>AUTHENTICATION_API_KEY</code>). Nunca é exposta no navegador.
                </td>
              </tr>
            </tbody>
          </table>
          <p className="guide-note">
            Toda chamada à API autentica com o header <code>apikey: SUA_API_KEY</code>.
          </p>
        </div>
      ),
    },
    {
      id: "teste",
      title: "Teste rápido de conexão",
      icon: "🧪",
      content: (
        <div className="guide-test">
          <p>Execute no PowerShell (com a Evolution online):</p>
          <div className="guide-code">
            <pre>{`curl.exe -X GET "http://127.0.0.1:8080/instance/connectionState/dipefy-drop" -H "apikey: SUA_API_KEY"`}</pre>
            <CopyButton text={`curl.exe -X GET "http://127.0.0.1:8080/instance/connectionState/dipefy-drop" -H "apikey: SUA_API_KEY"`} />
          </div>
          <p className="guide-note">
            Resposta esperada (conectado):{" "}
            <code>{`{ "instance": { "state": "open", "instanceName": "dipefy-drop" } }`}</code>
          </p>
        </div>
      ),
    },
    {
      id: "solucao",
      title: "Solução de problemas",
      icon: "🛠️",
      content: (
        <table className="guide-table">
          <thead>
            <tr>
              <th>Sintoma</th>
              <th>Causa provável</th>
              <th>Correção</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Docker indisponível</td>
              <td>WSL2 desativado</td>
              <td>
                Executar <code>C:\evolution-local\enable-wsl.ps1</code> como admin e reiniciar o
                Windows
              </td>
            </tr>
            <tr>
              <td>Serviço local não encontrado</td>
              <td>Bridge parado</td>
              <td>Iniciar o Evolution Local Bridge (porta 3210)</td>
            </tr>
            <tr>
              <td>Evolution online, WhatsApp close</td>
              <td>QR não escaneado</td>
              <td>Abrir o Manager e conectar a instância</td>
            </tr>
            <tr>
              <td>Envio direto desativado</td>
              <td>Proteção da API key</td>
              <td>Enviar pelo Evolution Manager ou WhatsApp Web</td>
            </tr>
          </tbody>
        </table>
      ),
    },
  ];

  return (
    <section className="card evolution-guide" aria-labelledby="evolution-guide-title">
      <header className="evolution-guide-header">
        <span className="evolution-local-icon">
          <BookOpen size={21} />
        </span>
        <div>
          <span className="section-kicker">Documentação</span>
          <h2 id="evolution-guide-title">Guia de acesso — Evolution API</h2>
          <p>Do login à conexão do WhatsApp, passo a passo para iniciantes.</p>
        </div>
      </header>

      <div className="guide-accordion">
        {sections.map((section) => {
          const isOpen = open === section.id;
          return (
            <div key={section.id} className={`guide-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="guide-item-toggle"
                onClick={() => setOpen(isOpen ? null : section.id)}
                aria-expanded={isOpen}
              >
                <span className="guide-item-icon">{section.icon}</span>
                <span className="guide-item-title">{section.title}</span>
                <ChevronDown size={17} className={`guide-chevron ${isOpen ? "rotate" : ""}`} />
              </button>
              {isOpen && <div className="guide-item-body">{section.content}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
