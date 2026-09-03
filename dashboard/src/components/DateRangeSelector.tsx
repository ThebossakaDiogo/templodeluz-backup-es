import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";

export type DateRangePreset = "today" | "yesterday" | "7d" | "14d" | "30d" | "this_month" | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface DateRangeSelectorProps {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
}

// Helpers para datas locais YYYY-MM-DD
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectPreset = (preset: DateRangePreset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    let label = "Hoje";

    if (preset === "today") {
      start = new Date();
      end = new Date();
      label = "Hoje";
    } else if (preset === "yesterday") {
      start = new Date();
      start.setDate(today.getDate() - 1);
      end = new Date(start);
      label = "Ontem";
    } else if (preset === "7d") {
      start = new Date();
      start.setDate(today.getDate() - 6);
      end = new Date();
      label = "7 Dias";
    } else if (preset === "14d") {
      start = new Date();
      start.setDate(today.getDate() - 13);
      end = new Date();
      label = "14 Dias";
    } else if (preset === "30d") {
      start = new Date();
      start.setDate(today.getDate() - 29);
      end = new Date();
      label = "30 Dias";
    } else if (preset === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date();
      label = "Este Mês";
    }

    const startStr = toDateString(start);
    const endStr = toDateString(end);
    setTempStart(startStr);
    setTempEnd(endStr);

    onChange({
      preset,
      label,
      startDate: startStr,
      endDate: endStr,
    });
    setIsOpen(false);
  };

  const applyCustom = () => {
    if (!tempStart || !tempEnd) return;
    const startObj = new Date(tempStart + "T00:00:00");
    const endObj = new Date(tempEnd + "T23:59:59");
    if (startObj > endObj) {
      alert("A data inicial não pode ser posterior à data final.");
      return;
    }

    const label =
      tempStart === tempEnd
        ? formatDateBR(tempStart)
        : `${formatDateBR(tempStart)} a ${formatDateBR(tempEnd)}`;

    onChange({
      preset: "custom",
      label,
      startDate: tempStart,
      endDate: tempEnd,
    });
    setIsOpen(false);
  };

  const isCustomActive = value.preset === "custom";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--surface-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "11px",
          padding: "3px",
          gap: "2px",
        }}
      >
        {/* Presets Rápidos */}
        {[
          { key: "today", label: "Hoje" },
          { key: "7d",    label: "7D" },
          { key: "14d",   label: "14D" },
          { key: "30d",   label: "30D" },
        ].map((item) => {
          const active = value.preset === item.key;
          return (
            <button
              key={item.key}
              onClick={() => selectPreset(item.key as DateRangePreset)}
              style={{
                fontSize: "11.5px",
                fontWeight: active ? 600 : 400,
                padding: "4px 10px",
                borderRadius: "8px",
                border: active ? "1px solid var(--border-strong)" : "1px solid transparent",
                cursor: "pointer",
                background: active ? "var(--surface-selected)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.14s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}

        {/* Divisor */}
        <div style={{ width: "1px", height: "14px", background: "var(--border-subtle)", margin: "0 2px" }} />

        {/* Botão de Calendário / Personalizado */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11.5px",
            fontWeight: isCustomActive ? 600 : 400,
            padding: "4px 9px",
            borderRadius: "8px",
            border: isCustomActive ? "1px solid var(--accent-border)" : "1px solid transparent",
            cursor: "pointer",
            background: isCustomActive ? "var(--accent-soft-bg)" : "transparent",
            color: isCustomActive ? "var(--accent-strong)" : "var(--text-muted)",
            boxShadow: isCustomActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.14s ease",
          }}
          title="Selecionar período personalizado"
        >
          <Calendar style={{ width: "12px", height: "12px" }} strokeWidth={1.8} />
          <span>{isCustomActive ? value.label : "Personalizar"}</span>
          <ChevronDown
            style={{
              width: "11px",
              height: "11px",
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.15s ease",
            }}
          />
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET DE CALENDÁRIO PERSONALIZADO (PORTALIZADO NO BODY - NUNCA CORTADO POR OVERFLOW OU HEAD) */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "370px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: "20px",
              padding: "22px",
              boxShadow: "var(--shadow-dock, 0 20px 60px rgba(0, 0, 0, 0.5))",
              position: "relative",
            }}
          >
            {/* Cabeçalho do Popover */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar style={{ width: "15px", height: "15px", color: "var(--accent-strong)" }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Filtrar por Período
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn"
                style={{
                  width: "28px",
                  height: "28px",
                  padding: 0,
                  borderRadius: "7px",
                }}
              >
                <X style={{ width: "13px", height: "13px" }} />
              </button>
            </div>

            {/* Atalhos Rápidos */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Atalhos Rápidos
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[
                  { key: "today", label: "Hoje" },
                  { key: "yesterday", label: "Ontem" },
                  { key: "7d", label: "Últimos 7 dias" },
                  { key: "14d", label: "Últimos 14 dias" },
                  { key: "this_month", label: "Este Mês" },
                  { key: "30d", label: "Últimos 30 dias" },
                ].map((p) => {
                  const active = value.preset === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => selectPreset(p.key as DateRangePreset)}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: active ? 600 : 400,
                        padding: "8px 11px",
                        borderRadius: "8px",
                        border: active ? "1px solid var(--accent-border)" : "1px solid var(--border-subtle)",
                        background: active ? "var(--accent-soft-bg)" : "var(--surface-1)",
                        color: active ? "var(--accent-strong)" : "var(--text-secondary)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.14s ease",
                      }}
                    >
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intervalo Customizado */}
            <div style={{ marginBottom: "18px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Intervalo Específico
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      padding: "8px 11px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface-1)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Data Final:
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      padding: "8px 11px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface-1)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setIsOpen(false)}
                className="btn"
                style={{ fontSize: "12px", height: "36px", padding: "0 13px" }}
              >
                Cancelar
              </button>
              <button
                onClick={applyCustom}
                className="btn btn-primary"
                style={{ fontSize: "12px", height: "36px", padding: "0 16px" }}
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
