import pizza from "@/assets/pizza.jpg";
import burger from "@/assets/burger.jpg";
import pasta from "@/assets/pasta.jpg";
import drinks from "@/assets/drinks.jpg";
import dessert from "@/assets/dessert.jpg";
import fallback from "@/assets/default.jpg";

export type Settings = {
  name: string;
  tagline: string;
  hero_image_url: string;
  phone: string;
  address: string;
  google_maps_url: string;
};
export type Category = { id: string; name: string; display_order: number };
export type MenuItem = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  is_available: boolean;
};
export type RestaurantData = {
  settings: Settings;
  categories: Category[];
  menu_items: MenuItem[];
};

// Super Admin (developer) controlled branding — not editable from /admin.
export const SUPER_ADMIN_SETTINGS: Settings = {
  name: "Ember & Fork",
  tagline: "Fire-kissed comfort food, served fast.",
  hero_image_url: "",
  phone: "+91 98765 43210",
  address: "42 MG Road, Bengaluru, Karnataka",
  google_maps_url: "https://maps.google.com/?q=MG+Road+Bengaluru",
};

export function imageFor(categoryName: string): string {
  const n = categoryName.toLowerCase();
  if (n.includes("pizza")) return pizza;
  if (n.includes("burger") || n.includes("sandwich")) return burger;
  if (n.includes("pasta") || n.includes("noodle")) return pasta;
  if (n.includes("drink") || n.includes("beverage") || n.includes("juice") || n.includes("coffee")) return drinks;
  if (n.includes("dessert") || n.includes("sweet") || n.includes("cake")) return dessert;
  return fallback;
}

export const MOCK_DATA: RestaurantData = {
  settings: SUPER_ADMIN_SETTINGS,
  categories: [
    { id: "c1", name: "Pizza", display_order: 1 },
    { id: "c2", name: "Burgers", display_order: 2 },
    { id: "c3", name: "Pasta", display_order: 3 },
    { id: "c4", name: "Starters", display_order: 4 },
    { id: "c5", name: "Drinks", display_order: 5 },
    { id: "c6", name: "Desserts", display_order: 6 },
  ],
  menu_items: [
    { id: "m1", category_id: "c1", title: "Margherita Fiamma", description: "San Marzano tomato, fior di latte, torn basil, wood-fired.", price: 349, is_available: true },
    { id: "m2", category_id: "c1", title: "Pepperoni Inferno", description: "Spicy pepperoni, hot honey drizzle, chilli flakes.", price: 449, is_available: true },
    { id: "m3", category_id: "c1", title: "Truffle Funghi", description: "Wild mushrooms, truffle oil, parmesan snow.", price: 499, is_available: false },
    { id: "m4", category_id: "c2", title: "Double Smash", description: "Two crispy patties, cheddar, pickles, house sauce.", price: 399, is_available: true },
    { id: "m5", category_id: "c2", title: "Smoky BBQ Stack", description: "Bacon jam, onion rings, smoked BBQ glaze.", price: 429, is_available: true },
    { id: "m6", category_id: "c2", title: "Crispy Paneer Burger", description: "Spiced paneer, slaw, peri-peri mayo.", price: 319, is_available: true },
    { id: "m7", category_id: "c3", title: "Cacio e Pepe", description: "Fresh tagliatelle, pecorino, cracked black pepper.", price: 389, is_available: true },
    { id: "m8", category_id: "c3", title: "Arrabbiata Rossa", description: "Penne in fiery garlic-tomato sauce.", price: 339, is_available: true },
    { id: "m9", category_id: "c4", title: "Loaded Fries", description: "Cheese sauce, jalapeños, spring onion.", price: 229, is_available: true },
    { id: "m10", category_id: "c4", title: "Garden Crunch Salad", description: "Seasonal greens, citrus dressing, toasted seeds.", price: 259, is_available: true },
    { id: "m11", category_id: "c5", title: "Mango Chilli Cooler", description: "Alphonso mango, lime, a kick of chilli.", price: 169, is_available: true },
    { id: "m12", category_id: "c5", title: "Cold Brew Tonic", description: "Slow-steeped coffee, tonic, orange peel.", price: 189, is_available: false },
    { id: "m13", category_id: "c6", title: "Molten Lava Cake", description: "Dark chocolate core, vanilla bean gelato.", price: 249, is_available: true },
    { id: "m14", category_id: "c6", title: "Tiramisu Jar", description: "Espresso-soaked ladyfingers, mascarpone cream.", price: 229, is_available: true },
  ],
};
