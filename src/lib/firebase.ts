import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MOCK_DATA, SUPER_ADMIN_SETTINGS, type RestaurantData } from "./menu-data";
import { permittedUpdate, restaurantIdOrMain, restaurantRole, type RestaurantRole } from "./restaurant-access";

// ─── Paste your Firebase web config below ────────────────────────────────────
// Copy each value from: Firebase Console → Project settings → Your apps → SDK setup and configuration (Config)
const firebaseConfig = {
  apiKey: "AIzaSyBtzZUhch15aMvE5Fsx0PrkKrC1ZEegzQs",
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
function restaurantDoc(restaurantId = "main") {
  const a = getApp();
  return a ? doc(getFirestore(a), "restaurant_data", restaurantIdOrMain(restaurantId)) : null;
}

/** Single read: the whole menu lives in one document. */
export async function fetchRestaurant(restaurantId = "main", allowDemo = true): Promise<RestaurantData> {
  const id = restaurantIdOrMain(restaurantId);
  const ref = restaurantDoc(id);
  if (!ref) {
    if (id === "main" && allowDemo) return MOCK_DATA;
    throw new Error("Restaurant is unavailable");
  }
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (id === "main" && allowDemo) return MOCK_DATA;
      throw new Error("Restaurant not found");
    }
    const d = snap.data() as Partial<RestaurantData>;
    return {
      settings: { ...SUPER_ADMIN_SETTINGS, ...(d.settings ?? {}) },
      categories: d.categories ?? [],
      menu_items: d.menu_items ?? [],
    };
}

/** Access is stored separately from the public menu and enforced by Firestore rules. */
export async function fetchRestaurantRole(restaurantId = "main"): Promise<RestaurantRole> {
  const a = getApp();
  const user = firebaseAuth()?.currentUser;
  if (!a || !user) return "denied";
  const token = await user.getIdTokenResult();
  const email = typeof token.claims.email === "string" ? token.claims.email : null;
  if (restaurantRole(email, token.claims.email_verified === true, user.uid, []) === "superadmin") return "superadmin";
  const access = await getDoc(doc(getFirestore(a), "restaurant_access", restaurantIdOrMain(restaurantId)));
  const owners = access.data()?.owner_uids;
  return restaurantRole(email, token.claims.email_verified === true, user.uid, Array.isArray(owners) ? owners : []);
}

/** Never read before writes: owners patch only menu_items; rules verify every write. */
export async function saveRestaurant(restaurantId: string, data: Partial<RestaurantData>, role: RestaurantRole, exists = true) {
  const ref = restaurantDoc(restaurantId);
  if (!ref) throw new Error("Firebase is not configured");
  if (!permittedUpdate(role, Object.keys(data))) throw new Error("You do not have permission to make this change");
  if (exists) await updateDoc(ref, data);
  else {
    if (role !== "superadmin") throw new Error("Only super admins can create restaurants");
    await setDoc(ref, { settings: SUPER_ADMIN_SETTINGS, categories: [], menu_items: [], ...data });
  }
}
