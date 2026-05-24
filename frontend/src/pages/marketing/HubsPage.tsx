import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

const hubs = [
  {
    city: "Addis Ababa Hub",
    address: "Bole, Addis Ababa",
    total: 80,
    available: 40,
    tags: ["Wi-Fi", "24/7 Access", "Mentorship"],
    primary: true,
  },
  {
    city: "Bahir Dar Hub",
    address: "Downtown Bahir Dar",
    total: 50,
    available: 12,
    tags: ["Co-working", "Wi-Fi"],
    primary: false,
  },
  {
    city: "Hawassa Hub",
    address: "Lake Hawassa District",
    total: 40,
    available: 5,
    tags: ["Mentorship", "Labs"],
    primary: false,
  },
];

export function HubsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <p className="text-center text-xs uppercase text-primary">Empowering youth through technology</p>
      <h1 className="mt-4 text-center text-4xl font-bold">
        Nationwide <span className="text-primary">Learning Hubs</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-secondary)]">
        High-speed internet, mentorship, and collaborative spaces across Ethiopia.
      </p>

      <div className="mt-12 aspect-[21/9] rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-[var(--bg-card)] flex items-center justify-center text-[var(--text-muted)]">
        Ethiopia hub map — Addis Ababa, Bahir Dar, Hawassa, Mekelle, Dire Dawa
      </div>

      <div className="mt-12 flex items-center justify-between">
        <h2 className="text-xl font-bold">Available Locations</h2>
        <Button variant="outline" size="sm">
          Filter Hubs
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {hubs.map((hub) => (
          <Card key={hub.city}>
            <div className="flex items-start gap-2">
              <MapPin className="text-primary" size={20} />
              <div>
                <h3 className="font-semibold">{hub.city}</h3>
                <p className="text-sm text-[var(--text-muted)]">{hub.address}</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              <span className="text-success">{hub.available} available</span> / {hub.total} seats
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hub.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <Button className="mt-4 w-full" variant={hub.primary ? "primary" : "outline"}>
              Reserve a seat
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
