import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/ShopPage";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Browse women's dresses, tops and skirts with retail and wholesale pricing." },
      { property: "og:title", content: "Shop — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Browse women's dresses, tops and skirts with retail and wholesale pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
