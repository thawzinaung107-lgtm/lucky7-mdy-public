import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/ProductPage";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Product — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Choose colors and sizes and add this item to your cart." },
      { property: "og:title", content: "Product — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Choose colors and sizes and add this item to your cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
