import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rastreamento")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
