import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm text-white placeholder:text-[var(--text-muted)] transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-white", className)}>{children}</label>;
}
