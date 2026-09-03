import { useState, useRef, useEffect } from "react";
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
          background: "#0D0E16",
          border: "1px solid #252733",
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
                border: "none",
                cursor: "pointer",
                background: active ? "#292A35" : "transparent",
                color: active ? "#F5F4FA" : "#707281",
                boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                transition: "all 0.14s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}

        {/* Divisor */}
        <div style={{ width: "1px", height: "14px", background: "#252733", margin: "0 2px" }} />

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
            border: "none",
            cursor: "pointer",
            background: isCustomActive ? "#292A35" : "transparent",
            color: isCustomActive ? "#BDB4EF" : "#707281",
            boxShadow: isCustomActive ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
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
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease",
            }}
          />
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET DE CALENDÁRIO PERSONALIZADO (FIXED - NUNCA CORTADO POR OVERFLOW) */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0, 0, 0, 0.62)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="fade-up"
            style={{
              width: "100%",
              maxWidth: "360px",
              background: "#11121A",
              border: "1px solid #2A2C38",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 16px 50px rgba(0, 0, 0, 0.45)",
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
              borderBottom: "1px solid rgba(255,255,255,0.075)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar style={{ width: "14px", height: "14px", color: "#BDB4EF" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F5F4FA" }}>
                Filtrar por Período
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#707281",
                padding: "2px",
                display: "flex",
              }}
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div style={{ marginBottom: "14px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 500, color: "#707281", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
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
                    fontWeight: value.preset === p.key ? 600 : 400,
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: value.preset === p.key ? "1px solid rgba(189, 180, 239, 0.35)" : "1px solid #232532",
                    background: value.preset === p.key ? "rgba(189, 180, 239, 0.12)" : "#0B0C14",
                    color: value.preset === p.key ? "#BDB4EF" : "#A2A3AE",
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
              ))}
            </div>
          </div>

          {/* Intervalo Customizado */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 500, color: "#707281", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
              Intervalo Específico
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#A2A3AE", display: "block", marginBottom: "3px" }}>
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid #282A36",
                    background: "#0B0C14",
                    color: "#F5F4FA",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#A2A3AE", display: "block", marginBottom: "3px" }}>
                  Data Final:
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid #282A36",
                    background: "#0B0C14",
                    color: "#F5F4FA",
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
              style={{ fontSize: "12px", height: "34px", padding: "0 12px" }}
            >
              Cancelar
            </button>
            <button
              onClick={applyCustom}
              className="btn btn-primary"
              style={{ fontSize: "12px", height: "34px", padding: "0 14px" }}
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
