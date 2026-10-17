export function menuHead(restaurantId = "main") {
  const title = restaurantId === "main" ? "Ember & Fork — Digital Menu" : `${restaurantId} — Restaurant Menu`;
  const description = `Browse dishes and prices for ${restaurantId === "main" ? "Ember & Fork" : restaurantId}.`;
  return { meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] };
}

export function adminHead(restaurantId = "main") {
  const title = `${restaurantId} — Restaurant Administration`;
  const description = `Authorized menu management for ${restaurantId}.`;
  return { meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] };
}