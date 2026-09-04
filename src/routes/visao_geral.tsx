import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/visao_geral")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
