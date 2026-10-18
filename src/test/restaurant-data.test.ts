import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  read: vi.fn(), update: vi.fn(), create: vi.fn(), doc: vi.fn((_db: unknown, collection: string, id: string) => `${collection}/${id}`),
  auth: { currentUser: null as null | { uid: string; getIdTokenResult: ReturnType<typeof vi.fn> } },
}));
vi.mock("firebase/app", () => ({ initializeApp: () => ({}), getApps: () => [] }));
vi.mock("firebase/auth", () => ({ getAuth: () => mocks.auth }));
vi.mock("firebase/firestore", () => ({ getFirestore: () => ({}), doc: mocks.doc, getDoc: mocks.read, updateDoc: mocks.update, setDoc: mocks.create }));

import { fetchRestaurant, fetchRestaurantRole, saveRestaurant } from "@/lib/firebase";

describe("Tenant document reads and writes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.currentUser = null; });
  it("reads exactly one matching restaurant document including its hero and category image", async () => {
    mocks.read.mockResolvedValue({ exists: () => true, data: () => ({ settings: { name: "Cafe Two", hero_image_url: "https://example.com/cafe.jpg" }, categories: [{ id: "tea", name: "Tea", display_order: 1, image_url: "https://example.com/tea.jpg" }], menu_items: [] }) });
    const data = await fetchRestaurant("cafe-two");
    expect(mocks.read).toHaveBeenCalledTimes(1);
    expect(mocks.read).toHaveBeenCalledWith("restaurant_data/cafe-two");
    expect(data.settings.name).toBe("Cafe Two");
    expect(data.settings.hero_image_url).toBe("https://example.com/cafe.jpg");
    expect(data.categories[0]?.image_url).toBe("https://example.com/tea.jpg");
  });
  it("defaults its single read to main", async () => {
    mocks.read.mockResolvedValue({ exists: () => true, data: () => ({}) });
    await fetchRestaurant();
    expect(mocks.read).toHaveBeenCalledTimes(1);
    expect(mocks.read).toHaveBeenCalledWith("restaurant_data/main");
  });
  it("never substitutes main's menu for a missing tenant", async () => {
    mocks.read.mockResolvedValue({ exists: () => false });
    await expect(fetchRestaurant("missing-cafe")).rejects.toThrow("Restaurant not found");
  });
  it("owners patch only menu items without another read", async () => {
    const items = [{ id: "tea", category_id: "drinks", title: "Tea", description: "", price: 25, is_available: false }];
    await saveRestaurant("cafe-two", { menu_items: items }, "owner");
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith("restaurant_data/cafe-two", { menu_items: items });
    await expect(saveRestaurant("cafe-two", { categories: [] }, "owner")).rejects.toThrow("permission");
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });
  it("verified super admins bypass restaurant access reads even when Firestore denies them", async () => {
    const getIdTokenResult = vi.fn().mockResolvedValue({ claims: { email: "pragathimedi10@gmail.com", email_verified: true } });
    mocks.auth.currentUser = { uid: "super", getIdTokenResult };
    mocks.read.mockRejectedValue(new Error("Missing or insufficient permissions"));
    expect(await fetchRestaurantRole("burger2rolls")).toBe("superadmin");
    expect(getIdTokenResult).toHaveBeenCalledWith(true);
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("unverified super admins still get access without an access read", async () => {
    mocks.auth.currentUser = { uid: "super", getIdTokenResult: vi.fn().mockResolvedValue({ claims: { email: "pragathimedi10@gmail.com", email_verified: false } }) };
    expect(await fetchRestaurantRole("burger2rolls")).toBe("superadmin");
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("other accounts still require the matching restaurant assignment", async () => {
    mocks.auth.currentUser = { uid: "owner-a", getIdTokenResult: vi.fn().mockResolvedValue({ claims: { email: "owner@example.com", email_verified: true } }) };
    mocks.read.mockResolvedValue({ data: () => ({ owner_uids: ["owner-b"] }) });
    expect(await fetchRestaurantRole("burger2rolls")).toBe("denied");
    expect(mocks.read).toHaveBeenCalledWith("restaurant_access/burger2rolls");
  });
});