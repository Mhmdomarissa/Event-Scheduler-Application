"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Lock,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatDateTime, statusConfig, getEventStatus } from "@/lib/utils";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const status = event.lifecycle ?? getEventStatus(event.startAt, event.endAt);
  const cfg = statusConfig[status];
  const creator =
    typeof event.createdBy === "object"
      ? (event.createdBy as { displayName?: string; email: string }).displayName ||
        (event.createdBy as { email: string }).email
      : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link href={`/events/${event.id}`} className="group block">
        <Card className="h-full overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:border-primary/40 group-hover:-translate-y-0.5">
          <CardContent className="p-5 space-y-3">
            {/* Title + status */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              <Badge
                variant={cfg.variant}
                className={cn(
                  "shrink-0 text-xs",
                  status === "upcoming" && "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
                  status === "ongoing" && "bg-green-500/10 text-green-600 border-green-500/30",
                )}
              >
                {cfg.label}
              </Badge>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            )}

            {/* Meta */}
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary/70" />
                <span>{formatDate(event.startAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary/70" />
                <span>
                  {formatDateTime(event.startAt).split(" at ")[1]} –{" "}
                  {formatDateTime(event.endAt).split(" at ")[1]}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary/70" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-5 py-3 border-t bg-accent/30 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              <span className="truncate max-w-32">{creator}</span>
            </div>
            <div className="flex items-center gap-2">
              {event.visibility === "private" ? (
                <Lock className="size-3.5" />
              ) : (
                <Globe className="size-3.5" />
              )}
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
