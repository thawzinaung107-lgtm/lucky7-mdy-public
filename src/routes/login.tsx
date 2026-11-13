import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in with Telegram — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Sign in with your Telegram account to keep your cart and orders." },
      { property: "og:title", content: "Sign in with Telegram — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Sign in with your Telegram account to keep your cart and orders." },
    ],
  }),
  component: Page,
});
