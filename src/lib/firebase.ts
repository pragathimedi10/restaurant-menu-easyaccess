import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MOCK_DATA, SUPER_ADMIN_SETTINGS, type RestaurantData } from "./menu-data";

// ─── Paste your Firebase web config below ────────────────────────────────────
// Copy each value from: Firebase Console → Project settings → Your apps → SDK setup and configuration (Config)
const firebaseConfig = {
  apiKey: "AlzaSyBtzZUhch15aMvE5Fsx0PrkKrC1ZEegzQs",
  authDomain: "restaurant-web-3976b.firebaseapp.com",
  projectId: "restaurant-web-3976b",
  storageBucket: "restaurant-web-3976b.firebasestorage.app",
  messagingSenderId: "886671923791",
  appId: "1:886671923791:web:f55e33042e443ad198e83a",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PASTE_YOUR"),
);

let app: FirebaseApp | null = null;
function getApp() {
  if (!isFirebaseConfigured) return null;
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}
export function firebaseAuth() {
  const a = getApp();
  return a ? getAuth(a) : null;
}
function mainDoc() {
  const a = getApp();
  return a ? doc(getFirestore(a), "restaurant_data", "main") : null;
}

/** Single read: the whole menu lives in one document. */
export async function fetchRestaurant(): Promise<RestaurantData> {
  const ref = mainDoc();
  if (!ref) return MOCK_DATA;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return MOCK_DATA;
    const d = snap.data() as Partial<RestaurantData>;
    return {
      settings: { ...SUPER_ADMIN_SETTINGS, ...(d.settings ?? {}) },
      categories: d.categories ?? [],
      menu_items: d.menu_items ?? [],
    };
  } catch (e) {
    console.warn("Firestore read failed, using demo data", e);
    return MOCK_DATA;
  }
}

/** Admins only write categories + menu_items; settings stay super-admin controlled. */
export async function saveMenu(data: Pick<RestaurantData, "categories" | "menu_items">) {
  const ref = mainDoc();
  if (!ref) throw new Error("Firebase is not configured");
  const snap = await getDoc(ref);
  if (snap.exists()) await updateDoc(ref, data);
  else await setDoc(ref, { settings: SUPER_ADMIN_SETTINGS, ...data });
}
