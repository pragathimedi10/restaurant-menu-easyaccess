import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/restaurant/menu-page";
import { menuHead } from "@/lib/restaurant-head";

export const Route = createFileRoute("/")({
  head: () => menuHead(),
  component: MenuPage,
});
