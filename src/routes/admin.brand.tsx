import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/BrandProposalPage";

export const Route = createFileRoute("/admin/brand")({
  head: () => ({
    meta: [
      { title: "Brand Proposal — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Brand colors and logo proposal for Lucky 7 Fashion Mandalay." },
      { property: "og:title", content: "Brand Proposal — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Brand colors and logo proposal for Lucky 7 Fashion Mandalay." },
    ],
  }),
  component: Page,
});
