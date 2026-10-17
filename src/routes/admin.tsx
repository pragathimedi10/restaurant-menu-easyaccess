import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/restaurant/admin-page";
import { adminHead } from "@/lib/restaurant-head";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => adminHead(),
  component: AdminPage,
});
