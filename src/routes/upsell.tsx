import { createFileRoute } from "@tanstack/react-router";
import { AjudaMilenaPage } from "./ajuda-milena";

export const Route = createFileRoute("/upsell")({
  head: () => ({
    meta: [
      { title: "Ajude na Cirurgia dos Olhos da Médium Milena | Templo de Luz" },
      {
        name: "description",
        content:
          "Uma corrente de amor e solidariedade para a cirurgia de catarata da médium Milena Medeiros. Ajude a manter acesa a luz das cartas psicografadas.",
      },
    ],
  }),
  component: AjudaMilenaPage,
});
