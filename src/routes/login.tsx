import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Sign in with Google to order faster." },
      { property: "og:title", content: "Sign in — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Sign in with Google to order faster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
