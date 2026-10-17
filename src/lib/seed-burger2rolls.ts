import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBtzZUhch15aMvE5Fsx0PrkKrC1ZEegzQs",
  authDomain: "restaurant-web-3976b.firebaseapp.com",
  projectId: "restaurant-web-3976b",
  storageBucket: "restaurant-web-3976b.firebasestorage.app",
  messagingSenderId: "886671923791",
  appId: "1:886671923791:web:f55e33042e443ad198e83a",
};

export const BURGER2ROLLS_ACCESS = {
  owner_uids: ["SpuuhWEupLS3eJI2PBHfeaKsyUj1"],
};

export const BURGER2ROLLS_DATA = {
  settings: {
    name: "Burger2Rolls",
    tagline: "Juicy Burgers & Crispy Rolls",
    phone: "+1 234 567 890",
    address: "456 Food Street, Downtown",
    google_maps_url: "https://maps.google.com",
    hero_image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  categories: [
    { id: "cat_burgers", name: "Burgers", display_order: 1, image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add" },
    { id: "cat_rolls", name: "Rolls & Wraps", display_order: 2, image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af" },
  ],
  menu_items: [
    { id: "item_1", category_id: "cat_burgers", title: "Classic Cheese Burger", description: "Double beef patty with melted cheddar", price: 9.99, is_available: true },
    { id: "item_2", category_id: "cat_rolls", title: "Spicy Chicken Roll", description: "Crispy chicken wrapped with special sauce", price: 7.49, is_available: true },
  ],
};

/**
 * Creates restaurant_access/burger2rolls and restaurant_data/burger2rolls
 * only if they don't already exist. Must be called while signed in as the
 * super admin — Firestore rules only allow the super admin to create these.
 * Returns which documents were created vs. skipped.
 */
export async function ensureBurger2Rolls(): Promise<{ created: string[]; skipped: string[] }> {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const created: string[] = [];
  const skipped: string[] = [];

  const accessRef = doc(db, "restaurant_access", "burger2rolls");
  if ((await getDoc(accessRef)).exists()) skipped.push("restaurant_access/burger2rolls");
  else {
    await setDoc(accessRef, BURGER2ROLLS_ACCESS);
    created.push("restaurant_access/burger2rolls");
  }

  const dataRef = doc(db, "restaurant_data", "burger2rolls");
  if ((await getDoc(dataRef)).exists()) skipped.push("restaurant_data/burger2rolls");
  else {
    await setDoc(dataRef, BURGER2ROLLS_DATA);
    created.push("restaurant_data/burger2rolls");
  }

  return { created, skipped };
}
