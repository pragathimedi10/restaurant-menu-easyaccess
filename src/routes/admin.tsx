import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { Trash2, Plus, Pencil, Check, X, LogOut } from "lucide-react";
import { z } from "zod";
import { firebaseAuth, fetchRestaurant, isFirebaseConfigured, saveMenu } from "@/lib/firebase";
import type { Category, MenuItem } from "@/lib/menu-data";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Menu Manager" },
      { name: "description", content: "Restaurant owner dashboard to manage menu categories and dishes." },
      { property: "og:title", content: "Admin — Menu Manager" },
      { property: "og:description", content: "Restaurant owner dashboard to manage menu categories and dishes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input = "glass w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "bg-fire inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50";
const uid = () => Math.random().toString(36).slice(2, 10);

function AdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return setUser(null);
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!isFirebaseConfigured) return <SetupNotice />;
  if (user === undefined) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) return <Login />;
  return <Dashboard user={user} />;
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
    try { await signInWithEmailAndPassword(firebaseAuth()!, p.data.email, p.data.pw); }
    catch { setErr("Invalid email or password."); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-sm space-y-3 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold">Owner <span className="text-fire">Login</span></h1>
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={`${btn} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

function Dashboard({ user }: { user: User }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [status, setStatus] = useState("");
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchRestaurant().then((d) => { setCats(d.categories); setItems(d.menu_items); });
  }, []);

  const persist = async (c: Category[], i: MenuItem[]) => {
    setCats(c); setItems(i); setStatus("Saving…");
    try { await saveMenu({ categories: c, menu_items: i }); setStatus("Saved ✓"); }
    catch (e) { setStatus("Save failed: " + (e as Error).message); }
  };

  const sorted = [...cats].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="mx-auto max-w-5xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">Menu <span className="text-fire">Manager</span></h1>
        <span className="text-sm text-muted-foreground">{status}</span>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">View menu</Link>
          <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
          <button onClick={() => signOut(firebaseAuth()!)} className="glass rounded-full p-2" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <section className="glass mt-6 rounded-2xl p-5">
        <h2 className="text-xl font-bold">Categories</h2>
        <form className="mt-3 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          const n = newCat.trim().slice(0, 40); if (!n) return;
          persist([...cats, { id: uid(), name: n, display_order: cats.length + 1 }], items); setNewCat("");
        }}>
          <input className={input} placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className={btn}><Plus className="h-4 w-4" />Add</button>
        </form>
        <ul className="mt-3 space-y-2">
          {sorted.map((c) => <CategoryRow key={c.id} c={c}
            onRename={(name) => persist(cats.map((x) => x.id === c.id ? { ...x, name } : x), items)}
            onDelete={() => { if (confirm(`Delete "${c.name}" and its dishes?`)) persist(cats.filter((x) => x.id !== c.id), items.filter((i) => i.category_id !== c.id)); }} />)}
        </ul>
      </section>

      <section className="glass mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Menu Items</h2>
          <button className={btn} disabled={!cats.length}
            onClick={() => setEditing({ id: "", category_id: sorted[0]?.id ?? "", title: "", description: "", price: 0, is_available: true })}>
            <Plus className="h-4 w-4" />Add dish
          </button>
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
              <button onClick={() => persist(cats, items.map((x) => x.id === i.id ? { ...x, is_available: !x.is_available } : x))}
                className={`rounded-full px-3 py-1 text-xs font-bold ${i.is_available ? "bg-success text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
                {i.is_available ? "In Stock" : "Sold Out"}
              </button>
              <button onClick={() => setEditing(i)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => { if (confirm(`Delete ${i.title}?`)) persist(cats, items.filter((x) => x.id !== i.id)); }} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryRow({ c, onRename, onDelete }: { c: Category; onRename: (n: string) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  return (
    <li className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2 pl-3">
      {edit ? <input className={input} value={name} onChange={(e) => setName(e.target.value)} /> : <span className="flex-1 font-semibold">{c.name}</span>}
      {edit ? (
        <>
          <button aria-label="Save" onClick={() => { const n = name.trim().slice(0, 40); if (n) onRename(n); setEdit(false); }}><Check className="h-4 w-4 text-success" /></button>
          <button aria-label="Cancel" onClick={() => { setName(c.name); setEdit(false); }}><X className="h-4 w-4" /></button>
        </>
      ) : <button aria-label="Rename" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /></button>}
      <button aria-label="Delete" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></button>
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
        <button type="button" onClick={onCancel} className="glass rounded-full px-4 py-2 text-sm">Cancel</button>
        <button className={btn}>Save</button>
      </div>
    </form>
  );
}
