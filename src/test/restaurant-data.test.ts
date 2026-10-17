import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  read: vi.fn(), update: vi.fn(), create: vi.fn(), doc: vi.fn((_db: unknown, collection: string, id: string) => `${collection}/${id}`),
}));
vi.mock("firebase/app", () => ({ initializeApp: () => ({}), getApps: () => [] }));
vi.mock("firebase/auth", () => ({ getAuth: () => ({ currentUser: null }) }));
vi.mock("firebase/firestore", () => ({ getFirestore: () => ({}), doc: mocks.doc, getDoc: mocks.read, updateDoc: mocks.update, setDoc: mocks.create }));

import { fetchRestaurant, saveRestaurant } from "@/lib/firebase";

describe("Tenant document reads and writes", () => {
  beforeEach(() => { vi.clearAllMocks(); });
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
});