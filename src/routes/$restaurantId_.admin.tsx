import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/restaurant/admin-page";
import { adminHead } from "@/lib/restaurant-head";

export const Route = createFileRoute("/$restaurantId_/admin")({
  ssr: false,
  head: ({ params }) => adminHead(params.restaurantId),
  component: RestaurantAdmin,
});

function RestaurantAdmin() {
  const { restaurantId } = Route.useParams();
  return <AdminPage restaurantId={restaurantId} />;
}