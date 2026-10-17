import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/restaurant/menu-page";
import { menuHead } from "@/lib/restaurant-head";

export const Route = createFileRoute("/$restaurantId")({
  head: ({ params }) => menuHead(params.restaurantId),
  component: RestaurantMenu,
});

function RestaurantMenu() {
  const { restaurantId } = Route.useParams();
  return <MenuPage restaurantId={restaurantId} />;
}