import { describe, expect, it } from "vitest";
import { permittedUpdate, restaurantIdOrMain, restaurantRole } from "@/lib/restaurant-access";

describe("Restaurant access", () => {
  it("defaults to main when no ID is provided", () => {
    expect(restaurantIdOrMain()).toBe("main");
    expect(restaurantIdOrMain("cafe-two")).toBe("cafe-two");
  });
  it("rejects document path injection", () => {
    expect(() => restaurantIdOrMain("main/other")).toThrow();
  });
  it("recognizes the configured super-admin email only when verified", () => {
    expect(restaurantRole(SUPER_ADMIN_EMAIL, true, "super", [])).toBe("superadmin");
    expect(restaurantRole(SUPER_ADMIN_EMAIL, false, "super", [])).toBe("denied");
  });
  it("limits super admins to settings, categories and menu items", () => {
    expect(permittedUpdate("superadmin", ["settings", "categories", "menu_items"])).toBe(true);
    expect(permittedUpdate("superadmin", ["owner_uids"])).toBe(false);
  });
  it("owners can edit menu items but cannot edit settings or categories", () => {
    expect(permittedUpdate("owner", ["menu_items"])).toBe(true);
    expect(permittedUpdate("owner", ["settings"])).toBe(false);
    expect(permittedUpdate("owner", ["categories"])).toBe(false);
    expect(permittedUpdate("owner", ["menu_items", "settings"])).toBe(false);
  });
  it("only assigned owners can manage a restaurant", () => {
    expect(restaurantRole("owner@example.com", false, "owner-a", ["owner-a"])).toBe("owner");
    expect(restaurantRole("owner@example.com", true, "owner-a", ["owner-b"])).toBe("denied");
    expect(permittedUpdate("denied", ["menu_items"])).toBe(false);
  });
});