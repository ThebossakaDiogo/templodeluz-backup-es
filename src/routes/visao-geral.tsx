import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/visao-geral")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
