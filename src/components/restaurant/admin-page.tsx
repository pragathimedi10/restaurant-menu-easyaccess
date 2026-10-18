import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, Check, X, LogOut } from "lucide-react";
import { z } from "zod";
import { firebaseAuth, fetchRestaurant, isFirebaseConfigured, fetchRestaurantRole, saveRestaurant } from "@/lib/firebase";
import { ensureBurger2Rolls } from "@/lib/seed-burger2rolls";
import { SUPER_ADMIN_SETTINGS, type Settings, type Category, type MenuItem } from "@/lib/menu-data";

import { Button } from "@/components/ui/button";
import type { RestaurantRole } from "@/lib/restaurant-access";

const input = "glass w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "bg-fire inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50";
const uid = () => Math.random().toString(36).slice(2, 10);

const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-email": "That email address looks invalid.",
  "auth/user-not-found": "No account exists for that email.",
  "auth/wrong-password": "Incorrect password for that account.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/network-request-failed": "Network error — check your connection and retry.",
  "auth/operation-not-allowed": "Email/Password sign-in is not enabled in the Firebase console.",
  "auth/configuration-not-found": "Email/Password sign-in is not enabled in the Firebase console.",
};

export function AdminPage({ restaurantId = "main" }: { restaurantId?: string }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return setUser(null);
    return onAuthStateChanged(auth, setUser);
  }, []);

  const [role, setRole] = useState<RestaurantRole | null>(null);
  const [accessError, setAccessError] = useState("");
  useEffect(() => {
    let alive = true; setRole(null); setAccessError("");
    if (user) fetchRestaurantRole(restaurantId).then((value) => { if (alive) setRole(value); }).catch(() => { if (alive) setAccessError("Unable to verify restaurant access. Check the restaurant access permissions."); });
    return () => { alive = false; };
  }, [user, restaurantId]);

  if (!isFirebaseConfigured) return <SetupNotice />;
  if (user === undefined) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) return <Login />;
  if (accessError || role === "denied") return <div className="p-10 text-center"><p role="alert" className="text-destructive">{accessError || "You do not have access to this restaurant."}</p><Button className="mt-4" onClick={() => { const auth = firebaseAuth(); if (auth) void signOut(auth); }}>Sign out</Button></div>;
  if (!role) return <div className="p-10 text-center text-muted-foreground">Checking access…</div>;
  return <Dashboard key={restaurantId + user.uid} user={user} restaurantId={restaurantId} role={role} />;
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl p-6 pt-16">
      <h1 className="text-3xl font-extrabold text-fire">Connect Firebase</h1>
      <p className="mt-3 text-muted-foreground">Add your Firebase web config as environment variables, then reload:</p>
      <pre className="glass mt-4 overflow-x-auto rounded-xl p-4 text-xs">{`VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=`}</pre>
      <p className="mt-3 text-sm text-muted-foreground">Enable Email/Password sign-in in Firebase Auth and create an owner account. The menu currently shows demo data.</p>
      <Link to="/" className="mt-6 inline-block text-primary">← Back to menu</Link>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.object({ email: z.string().trim().email(), pw: z.string().min(6) }).safeParse({ email, pw });
    if (!p.success) return setErr("Enter a valid email and password (6+ chars).");
    setBusy(true); setErr("");
    const auth = firebaseAuth();
    if (!auth) return setBusy(false);
    try {
      // Explicit Firebase Auth call using the config in src/lib/firebase.ts
      await signInWithEmailAndPassword(auth, p.data.email, p.data.pw);
    } catch (e) {
      if (e instanceof FirebaseError) {
        const msg = FIREBASE_AUTH_ERRORS[e.code] ?? e.message;
        setErr(`Sign-in failed (${e.code}): ${msg}`);
        toast.error(`Sign-in failed (${e.code})`, { description: msg });
      } else {
        setErr("Sign-in failed: unexpected error.");
        toast.error("Sign-in failed", { description: "Unexpected error. Please try again." });
      }
    }
    setBusy(false);
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-sm space-y-3 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold">Owner <span className="text-fire">Login</span></h1>
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button className={`${btn} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </div>
  );
}

function Dashboard({ user, restaurantId, role }: { user: User; restaurantId: string; role: RestaurantRole }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [status, setStatus] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const [settings, setSettings] = useState<Settings>(SUPER_ADMIN_SETTINGS);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exists, setExists] = useState(true);
  const [loadError, setLoadError] = useState("");
  const superAdmin = role === "superadmin";
  useEffect(() => {
    let alive = true;
    fetchRestaurant(restaurantId, false).then((d) => { if (alive) { setCats(d.categories); setItems(d.menu_items); setSettings(d.settings); setReady(true); } }).catch((e) => {
      if (!alive) return;
      if (superAdmin && e instanceof Error && e.message === "Restaurant not found") { setExists(false); setReady(true); }
      else setLoadError(e instanceof Error ? e.message : "Unable to load restaurant");
    });
    return () => { alive = false; };
  }, [restaurantId, superAdmin]);

  const save = async (patch: Partial<import("@/lib/menu-data").RestaurantData>) => {
    if (busy || !ready) return false;
    setBusy(true); setStatus("Saving…");
    try {
      await saveRestaurant(restaurantId, exists ? patch : { settings, categories: cats, menu_items: items, ...patch }, role, exists);
      setExists(true); setStatus("Saved ✓"); return true;
    } catch (e) { setStatus("Save failed"); toast.error(e instanceof Error ? e.message : "Save failed"); return false; }
    finally { setBusy(false); }
  };
  const persist = async (c: Category[], i: MenuItem[]) => {
    const patch = superAdmin ? { categories: c, menu_items: i } : { menu_items: i };
    if (await save(patch)) { setCats(c); setItems(i); }
  };

  const sorted = [...cats].sort((a, b) => a.display_order - b.display_order);

  if (loadError) return <p role="alert" className="p-10 text-center text-destructive">{loadError}</p>;
  if (!ready) return <p className="p-10 text-center text-muted-foreground">Loading restaurant…</p>;
  return (
    <div className="mx-auto max-w-5xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">Menu <span className="text-fire">Manager</span></h1>
        <span className="text-sm text-muted-foreground">{status}</span>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link to="/$restaurantId" params={{ restaurantId }} className="text-muted-foreground hover:text-foreground">View menu</Link>
          <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
          <Button onClick={() => { const auth = firebaseAuth(); if (auth) void signOut(auth); }} className="glass rounded-full p-2" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>

      {superAdmin && <SeedButton />}
      {superAdmin && <SettingsForm settings={settings} onSave={async (next) => { if (await save({ settings: next })) setSettings(next); }} />}
      <fieldset disabled={busy} className="min-w-0">
      {superAdmin && <section className="mt-6 border-t border-border pt-5">
        <h2 className="text-xl font-bold">Categories</h2>
        <form className="mt-3 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          const n = newCat.trim().slice(0, 40); if (!n) return;
          persist([...cats, { id: uid(), name: n, display_order: cats.length + 1 }], items); setNewCat("");
        }}>
          <input className={input} placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Button className={btn}><Plus className="h-4 w-4" />Add</Button>
        </form>
        <ul className="mt-3 space-y-2">
          {sorted.map((c) => <CategoryRow key={c.id} c={c}
            onRename={(name, image_url) => persist(cats.map((x) => x.id === c.id ? { ...x, name, image_url } : x), items)}
            onDelete={() => { if (confirm(`Delete "${c.name}" and its dishes?`)) persist(cats.filter((x) => x.id !== c.id), items.filter((i) => i.category_id !== c.id)); }} />)}
        </ul>
      </section>}

      <section className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Menu Items</h2>
          <Button className={btn} disabled={!cats.length}
            onClick={() => setEditing({ id: "", category_id: sorted[0]?.id ?? "", title: "", description: "", price: 0, is_available: true })}>
            <Plus className="h-4 w-4" />Add dish
          </Button>
        </div>
        {editing && <ItemForm item={editing} cats={sorted} onCancel={() => setEditing(null)} onSave={(it) => {
          const next = it.id ? items.map((x) => x.id === it.id ? it : x) : [...items, { ...it, id: uid() }];
          persist(cats, next); setEditing(null);
        }} />}
        <div className="mt-4 space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{i.title} <span className="text-fire">₹{i.price}</span></p>
                <p className="truncate text-xs text-muted-foreground">{cats.find((c) => c.id === i.category_id)?.name} · {i.description}</p>
              </div>
              <Button onClick={() => persist(cats, items.map((x) => x.id === i.id ? { ...x, is_available: !x.is_available } : x))}
                className={`rounded-full px-3 py-1 text-xs font-bold ${i.is_available ? "bg-success text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
                {i.is_available ? "In Stock" : "Out of Stock"}
              </Button>
              <Button onClick={() => setEditing(i)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
              <Button onClick={() => { if (confirm(`Delete ${i.title}?`)) persist(cats, items.filter((x) => x.id !== i.id)); }} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>
      </fieldset>
    </div>
  );
}

function CategoryRow({ c, onRename, onDelete }: { c: Category; onRename: (n: string, url: string) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  const [url, setUrl] = useState(c.image_url ?? "");
  return (
    <li className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2 pl-3">
      {edit ? <div className="min-w-0 flex-1 space-y-2"><input aria-label="Category name" className={input} value={name} onChange={(e) => setName(e.target.value)} /><input aria-label="Category image URL" type="url" className={input} placeholder="Category image URL" value={url} onChange={(e) => setUrl(e.target.value)} /></div> : <span className="flex-1 font-semibold">{c.name}</span>}
      {edit ? (
        <>
          <Button aria-label="Save" onClick={() => { const n = name.trim().slice(0, 40); if (n && validImageUrl(url)) { onRename(n, url.trim()); setEdit(false); } else toast.error("Enter a category name and a valid HTTPS image URL, or leave the image blank."); }}><Check className="h-4 w-4 text-success" /></Button>
          <Button aria-label="Cancel" onClick={() => { setName(c.name); setUrl(c.image_url ?? ""); setEdit(false); }}><X className="h-4 w-4" /></Button>
        </>
      ) : <Button aria-label="Rename" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /></Button>}
      <Button aria-label="Delete" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </li>
  );
}

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(80),
  description: z.string().trim().max(240),
  price: z.number().min(0).max(100000),
  category_id: z.string().min(1, "Pick a category"),
});

function ItemForm({ item, cats, onSave, onCancel }: { item: MenuItem; cats: Category[]; onSave: (i: MenuItem) => void; onCancel: () => void }) {
  const [f, setF] = useState(item);
  const [err, setErr] = useState("");
  useEffect(() => setF(item), [item]);
  return (
    <form className="mt-4 grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const p = itemSchema.safeParse(f);
      if (!p.success) return setErr(p.error.issues[0]?.message ?? "Invalid input");
      onSave({ ...f, ...p.data });
    }}>
      <input className={input} placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <input className={input} type="number" min={0} placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
      <textarea className={`${input} sm:col-span-2`} rows={2} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <select className={input} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="flex justify-end gap-2">
        {err && <span className="self-center text-sm text-destructive">{err}</span>}
        <Button type="button" onClick={onCancel} className="glass rounded-full px-4 py-2 text-sm">Cancel</Button>
        <Button className={btn}>Save</Button>
      </div>
    </form>
  );
}

function SeedButton() {
  const [busy, setBusy] = useState(false);
  return (
    <section className="mt-6 border-t border-border pt-5">
      <h2 className="text-xl font-bold">Sample Data</h2>
      <p className="mt-1 text-sm text-muted-foreground">Creates the Burger2Rolls restaurant (access + menu documents) if it doesn't exist yet. Existing data is never overwritten.</p>
      <Button className={`${btn} mt-3`} disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const { created, skipped } = await ensureBurger2Rolls();
          if (created.length) toast.success(`Created: ${created.join(", ")}`);
          else toast.info("Burger2Rolls already exists — nothing changed.", { description: skipped.join(", ") });
        } catch (e) {
          toast.error("Seed failed", { description: e instanceof Error ? e.message : "Check Firestore rules and your sign-in." });
        } finally { setBusy(false); }
      }}>{busy ? "Seeding…" : "Seed Burger2Rolls"}</Button>
    </section>
  );
}

function validImageUrl(value: string) {
  if (!value.trim()) return true;
  try { return new URL(value.trim()).protocol === "https:"; } catch { return false; }
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (s: Settings) => Promise<void> }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  return <section className="mt-6 border-t border-border pt-5">
    <h2 className="text-xl font-bold">Restaurant Settings</h2>
    <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault();
      if (!form.name.trim() || !validImageUrl(form.hero_image_url) || !validImageUrl(form.google_maps_url)) { toast.error("Enter a restaurant title and valid HTTPS links."); return; }
      setSaving(true); try { await onSave(form); } finally { setSaving(false); }
    }}>
      {([{ key: "name", label: "Restaurant Title" }, { key: "phone", label: "Phone" }, { key: "address", label: "Address" }, { key: "google_maps_url", label: "Google Maps link" }, { key: "hero_image_url", label: "Hero Image URL" }] as const).map(({ key, label }) => <label key={key} className="space-y-1 text-sm"><span>{label}</span><input className={input} type={key.endsWith("url") ? "url" : "text"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === "name"} /></label>)}
      <div className="flex items-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save settings"}</Button></div>
    </form>
  </section>;
}
