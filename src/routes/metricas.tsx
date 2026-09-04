import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/metricas")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
