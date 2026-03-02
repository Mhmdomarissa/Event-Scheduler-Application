import Link from "next/link";
import { Calendar } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const apiHealthUrl =
    "https://event-scheduler-application-production.up.railway.app/health";

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Calendar className="size-4 text-primary" />
          Event Scheduler
          <span className="font-normal text-muted-foreground text-xs">v5</span>
        </div>

        <nav className="flex items-center gap-5">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/invitations" className="hover:text-foreground transition-colors">
            Invitations
          </Link>
          <Link href="/planner" className="hover:text-foreground transition-colors">
            AI Planner
          </Link>
          <a
            href={apiHealthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            API Health ↗
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub ↗
          </a>
        </nav>

        <p className="text-xs">© {year} Event Scheduler. All rights reserved.</p>
      </div>
    </footer>
  );
}
