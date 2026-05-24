import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-bold text-white", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-[var(--bg-base)]">
        E
      </span>
      <span>EthioTech</span>
    </Link>
  );
}
