import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, X } from "lucide-react";

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
      {/* Barra de Filtro Rápido com Segmented Control Estilo iOS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--bg-surface-alt)",
          border: "1px solid var(--border)",
          borderRadius: "11px",
          padding: "3px",
          gap: "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
                fontSize: "11px",
                fontWeight: active ? 800 : 600,
                padding: "5px 11px",
                borderRadius: "8px",
                border: active ? "1px solid rgba(0,0,0,0.04)" : "none",
                cursor: "pointer",
                background: active ? "var(--bg-surface)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: active ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}

        {/* Divisor */}
        <div style={{ width: "1px", height: "14px", background: "var(--border)", margin: "0 3px" }} />

        {/* Botão de Calendário / Personalizado */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: isCustomActive ? 800 : 600,
            padding: "5px 10px",
            borderRadius: "8px",
            border: isCustomActive ? "1px solid rgba(0,0,0,0.04)" : "none",
            cursor: "pointer",
            background: isCustomActive ? "var(--bg-surface)" : "transparent",
            color: isCustomActive ? "var(--primary-green)" : "var(--text-muted)",
            boxShadow: isCustomActive ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
            transition: "all 0.18s ease",
          }}
          title="Selecionar período personalizado"
        >
          <Calendar style={{ width: "12px", height: "12px" }} strokeWidth={2.2} />
          <span>{isCustomActive ? value.label : "Personalizar"}</span>
          <ChevronDown
            style={{
              width: "11px",
              height: "11px",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease",
            }}
          />
        </button>
      </div>

      {/* POPOVER FLUTUANTE DE CALENDÁRIO PERSONALIZADO */}
      {isOpen && (
        <div
          className="fade-up"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 9999,
            width: "320px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "18px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.4), 0 0 0 1px rgba(16, 185, 129, 0.2)",
          }}
        >
          {/* Cabeçalho do Popover */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar style={{ width: "14px", height: "14px", color: "var(--primary-green)" }} />
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                Filtrar por Período
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "2px",
                display: "flex",
              }}
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div style={{ marginBottom: "14px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
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
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => selectPreset(p.key as DateRangePreset)}
                  style={{
                    fontSize: "11px",
                    fontWeight: value.preset === p.key ? 800 : 500,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: value.preset === p.key ? "rgba(16, 185, 129, 0.15)" : "var(--bg-surface-alt)",
                    color: value.preset === p.key ? "var(--primary-green)" : "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{p.label}</span>
                  {value.preset === p.key && <Check style={{ width: "11px", height: "11px" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Datas Personalizadas (De / Até) */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
              Intervalo Específico
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "6px 10px",
                    borderRadius: "7px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface-alt)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                  Data Final:
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "6px 10px",
                    borderRadius: "7px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface-alt)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
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
              style={{ fontSize: "11px", padding: "6px 12px" }}
            >
              Cancelar
            </button>
            <button
              onClick={applyCustom}
              className="btn btn-emerald"
              style={{ fontSize: "11px", padding: "6px 14px" }}
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
