import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/telemetria")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
