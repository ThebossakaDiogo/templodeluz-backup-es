import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";

export type DateRangePreset = "today" | "yesterday" | "7d" | "14d" | "30d" | "this_month" | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  label: string;
  startDate: string;
  endDate: string;
}

interface DateRangeSelectorProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESETS: Array<{ key: Exclude<DateRangePreset, "custom">; label: string; shortLabel: string }> = [
  { key: "today", label: "Hoje", shortLabel: "Hoje" },
  { key: "yesterday", label: "Ontem", shortLabel: "Ontem" },
  { key: "7d", label: "Últimos 7 dias", shortLabel: "7D" },
  { key: "14d", label: "Últimos 14 dias", shortLabel: "14D" },
  { key: "this_month", label: "Este mês", shortLabel: "Mês" },
  { key: "30d", label: "Últimos 30 dias", shortLabel: "30D" },
];

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateBR(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function rangeForPreset(preset: Exclude<DateRangePreset, "custom">) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  } else if (preset === "7d") {
    start.setDate(today.getDate() - 6);
  } else if (preset === "14d") {
    start.setDate(today.getDate() - 13);
  } else if (preset === "30d") {
    start.setDate(today.getDate() - 29);
  } else if (preset === "this_month") {
    start.setDate(1);
  }

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    setError("");

    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, value.endDate, value.startDate]);

  const selectPreset = (preset: Exclude<DateRangePreset, "custom">) => {
    const range = rangeForPreset(preset);
    const presetMeta = PRESETS.find((item) => item.key === preset);
    onChange({ preset, label: presetMeta?.label ?? "Período", ...range });
    setIsOpen(false);
  };

  const applyCustom = () => {
    if (!tempStart || !tempEnd) {
      setError("Selecione as duas datas.");
      return;
    }
    if (new Date(`${tempStart}T00:00:00`) > new Date(`${tempEnd}T23:59:59`)) {
      setError("A data inicial deve ser anterior à data final.");
      return;
    }

    onChange({
      preset: "custom",
      label: tempStart === tempEnd ? formatDateBR(tempStart) : `${formatDateBR(tempStart)} a ${formatDateBR(tempEnd)}`,
      startDate: tempStart,
      endDate: tempEnd,
    });
    setIsOpen(false);
  };

  const popup = isOpen && typeof document !== "undefined" ? createPortal(
    <div
      className="date-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section
        className="date-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="date-dialog-header">
          <div>
            <span className="date-dialog-icon"><Calendar size={18} /></span>
            <div>
              <h2 id="date-dialog-title">Filtrar por período</h2>
              <p>Escolha um atalho ou defina um intervalo.</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar filtro de período">
            <X size={18} />
          </button>
        </header>

        <div className="date-dialog-content">
          <fieldset className="date-preset-fieldset">
            <legend>Atalhos rápidos</legend>
            <div className="date-preset-grid">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className={value.preset === preset.key ? "active" : ""}
                  onClick={() => selectPreset(preset.key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="date-custom-fieldset">
            <legend>Intervalo específico</legend>
            <div className="date-input-grid">
              <label>
                <span>Data inicial</span>
                <input type="date" value={tempStart} onChange={(event) => setTempStart(event.target.value)} />
              </label>
              <label>
                <span>Data final</span>
                <input type="date" value={tempEnd} onChange={(event) => setTempEnd(event.target.value)} />
              </label>
            </div>
            {error && <p className="date-dialog-error" role="alert">{error}</p>}
          </fieldset>
        </div>

        <footer className="date-dialog-actions">
          <button type="button" className="date-secondary-action" onClick={() => setIsOpen(false)}>Cancelar</button>
          <button type="button" className="date-primary-action" onClick={applyCustom}>Aplicar filtro</button>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="date-range-selector">
      <div className="date-range-desktop-container">
        {PRESETS.filter((preset) => ["today", "7d", "14d", "30d"].includes(preset.key)).map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={value.preset === preset.key ? "active" : ""}
            onClick={() => selectPreset(preset.key)}
          >
            {preset.shortLabel}
          </button>
        ))}
        <button
          type="button"
          className={`date-custom-trigger ${value.preset === "custom" ? "active" : ""}`}
          onClick={() => setIsOpen(true)}
        >
          <Calendar size={15} />
          <span>{value.preset === "custom" ? value.label : "Personalizar"}</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <button type="button" className="date-range-mobile-btn" onClick={() => setIsOpen(true)}>
        <Calendar size={17} />
        <span>{value.label}</span>
        <ChevronDown size={15} />
      </button>
      {popup}
    </div>
  );
}
