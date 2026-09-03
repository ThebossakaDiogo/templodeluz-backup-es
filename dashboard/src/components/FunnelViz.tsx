import { Funnel3DView } from "./Funnel3DView";
import type { Lead } from "@/types";

interface FunnelVizProps {
  leads: Lead[];
  loading?: boolean;
}

export function FunnelViz({ leads, loading }: FunnelVizProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Funnel3DView leads={leads} loading={loading} />
    </div>
  );
}
