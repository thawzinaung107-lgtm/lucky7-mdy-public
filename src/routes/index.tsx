import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucky 7 Fashion Mandalay — Women's Clothing" },
      { name: "description", content: "Dresses, blouses and skirts in Mandalay with retail and wholesale prices in MMK." },
      { property: "og:title", content: "Lucky 7 Fashion Mandalay — Women's Clothing" },
      { property: "og:description", content: "Dresses, blouses and skirts in Mandalay with retail and wholesale prices in MMK." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://images.pexels.com/photos/36200256/pexels-photo-36200256.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
      { name: "twitter:image", content: "https://images.pexels.com/photos/36200256/pexels-photo-36200256.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    ],
  }),
  component: Page,
});
