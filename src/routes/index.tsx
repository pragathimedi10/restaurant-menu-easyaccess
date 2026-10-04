import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search, Navigation } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { fetchRestaurant } from "@/lib/firebase";
import { MOCK_DATA, imageFor, type RestaurantData } from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember & Fork — Digital Menu" },
      { name: "description", content: "Browse our fire-kissed menu: pizzas, burgers, pasta, drinks and desserts." },
      { property: "og:title", content: "Ember & Fork — Digital Menu" },
      { property: "og:description", content: "Browse our fire-kissed menu: pizzas, burgers, pasta, drinks and desserts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [data, setData] = useState<RestaurantData>(MOCK_DATA);
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchRestaurant().then(setData); // the only DB read
  }, []);

  const s = data.settings;
  const cats = useMemo(() => [...data.categories].sort((a, b) => a.display_order - b.display_order), [data]);
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "";
  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.menu_items.filter(
      (i) =>
        (active === "all" || i.category_id === active) &&
        (!t || i.title.toLowerCase().includes(t) || i.description.toLowerCase().includes(t)),
    );
  }, [data, active, q]);
  const sections = useMemo(() => {
    const visible = active === "all" ? cats : cats.filter((c) => c.id === active);
    return visible
      .map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }))
      .filter((s) => s.items.length > 0);
  }, [cats, items, active]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="glow-orb absolute left-[-10%] top-[30%] h-72 w-72 rounded-full bg-primary/40" />
        <div className="glow-orb absolute right-[-10%] top-[60%] h-80 w-80 rounded-full bg-accent/25" style={{ animationDelay: "3s" }} />
        <div className="glow-orb absolute left-[40%] bottom-[-10%] h-64 w-64 rounded-full bg-destructive/30" style={{ animationDelay: "6s" }} />
      </div>

      <header className="relative">
        <img src={s.hero_image_url || hero} alt="" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto max-w-5xl px-5 pb-10 pt-16 sm:pt-24">
          <p className="rise text-xs font-bold uppercase tracking-[0.3em] text-accent">Scan · Browse · Feast</p>
          <h1 className="rise mt-3 text-5xl font-extrabold leading-none sm:text-7xl">
            <span className="text-fire">{s.name}</span>
          </h1>
          <p className="rise mt-3 max-w-md text-lg text-muted-foreground">{s.tagline}</p>
          <div className="glass rise mt-6 flex flex-col gap-3 rounded-2xl p-4 text-sm sm:flex-row sm:items-center">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{s.address}</span>
            <a href={`tel:${s.phone}`} className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{s.phone}</a>
            <a href={s.google_maps_url} target="_blank" rel="noreferrer"
              className="bg-fire inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-bold text-primary-foreground transition-transform hover:scale-105 sm:ml-auto">
              <Navigation className="h-4 w-4" /> Directions
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <div className="sticky top-0 z-10 -mx-5 bg-background/80 px-5 py-3 backdrop-blur-lg">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes..."
              className="glass w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[{ id: "all", name: "All" }, ...cats].map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  active === c.id ? "bg-fire scale-105 text-primary-foreground shadow-lg shadow-primary/30" : "glass text-muted-foreground hover:text-foreground"}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div key={active + q} className="mt-6 space-y-10">
          {sections.map((sec) => (
            <section key={sec.id}>
              <div className="rise relative mb-4 h-36 overflow-hidden rounded-2xl sm:h-44">
                <img src={imageFor(sec.name)} alt={sec.name} loading="lazy" width={944} height={704}
                  className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <h2 className="absolute bottom-3 left-4 text-2xl font-extrabold sm:text-3xl">{sec.name}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sec.items.map((i, idx) => (
                  <article key={i.id} style={{ animationDelay: `${idx * 40}ms` }}
                    className="rise glass rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold leading-tight">{i.title}</h3>
                      <span className="text-fire shrink-0 text-lg font-extrabold">₹{i.price}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {items.length === 0 && <p className="py-12 text-center text-muted-foreground">No dishes found.</p>}
        </div>
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">
        <Link to="/admin" className="hover:text-foreground">Staff login</Link>
      </footer>
    </div>
  );
}
