import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/CartPage";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Review your cart, quantities and prices before ordering." },
      { property: "og:title", content: "Your Cart — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Review your cart, quantities and prices before ordering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
