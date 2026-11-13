import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/AdminCatalogPage";

export const Route = createFileRoute("/admin/catalog")({
  head: () => ({
    meta: [
      { title: "Edit Catalog — Lucky 7 Fashion Mandalay" },
      { name: "description", content: "Staff page for editing product and category names." },
      { property: "og:title", content: "Edit Catalog — Lucky 7 Fashion Mandalay" },
      { property: "og:description", content: "Staff page for editing product and category names." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});
