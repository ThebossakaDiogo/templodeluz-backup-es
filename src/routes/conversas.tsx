import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conversas")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
