export const SUPER_ADMIN_EMAIL = "pragathimedi10@gmail.com";
export type RestaurantRole = "superadmin" | "owner" | "denied";

export function restaurantIdOrMain(id?: string): string {
  const value = id ?? "main";
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new Error("Invalid restaurant ID");
  return value;
}

export function restaurantRole(email: string | null, _verified: boolean, uid: string, owners: string[]): RestaurantRole {
  if (email === SUPER_ADMIN_EMAIL) return "superadmin";
  return owners.includes(uid) ? "owner" : "denied";
}

export function permittedUpdate(role: RestaurantRole, fields: string[]): boolean {
  if (role === "denied") return false;
  const allowed = role === "superadmin" ? ["settings", "categories", "menu_items"] : ["menu_items"];
  return fields.length > 0 && fields.every((field) => allowed.includes(field));
}