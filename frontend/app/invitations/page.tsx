"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useInvitations, useRespondToInvitation } from "@/features/invitations/hooks";
import { Mail, CalendarDays, Clock, MapPin, Check, X, HelpCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { statusConfig } from "@/lib/utils";
import type { Event } from "@/types";
import Link from "next/link";

const RSVP_OPTIONS = [
  { value: "attending", label: "Attending", icon: Check, color: "bg-emerald-500 hover:bg-emerald-600" },
  { value: "maybe", label: "Maybe", icon: HelpCircle, color: "" },
  { value: "declined", label: "Decline", icon: X, color: "" },
] as const;

export default function InvitationsPage() {
  const { data, isLoading, isError, error, refetch } = useInvitations();
  const respond = useRespondToInvitation();

  const invitations = data?.data ?? [];

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <PageHeader
          icon={<Mail className="size-5 text-primary" />}
          title="Invitations"
          description="Respond to event invitations you've received"
        />

        {isLoading && <LoadingSkeleton variant="row" rows={4} />}

        {isError && (
          <ErrorMessage
            error={error}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && invitations.length === 0 && (
          <EmptyState
            icon={<Mail className="size-8" />}
            title="No invitations"
            description="You haven't received any event invitations yet."
          />
        )}

        {!isLoading && invitations.length > 0 && (
          <div className="space-y-3">
            {invitations.map((inv) => {
              const event = typeof inv.eventId === "string" ? null : (inv.eventId as Event);
              const statusCfg = event
                ? (statusConfig[event.lifecycle as keyof typeof statusConfig] ?? statusConfig.upcoming)
                : null;

              return (
                <Card key={inv.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusCfg && (
                            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          )}
                          <h3 className="font-semibold">
                            {event ? (
                              <Link
                                href={`/events/${typeof inv.eventId === "string" ? inv.eventId : inv.eventId.id}`}
                                className="hover:underline underline-offset-4 inline-flex items-center gap-1"
                              >
                                {event.title}
                                <ExternalLink className="size-3" />
                              </Link>
                            ) : (
                              "Unknown Event"
                            )}
                          </h3>
                        </div>

                        {event && (
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3" />
                              {format(new Date(event.startAt), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {format(new Date(event.startAt), "h:mm a")}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Current RSVP:{" "}
                          <span className="font-medium capitalize">{inv.status}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {RSVP_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                          <Button
                            key={value}
                            size="sm"
                            variant={inv.status === value ? "default" : "outline"}
                            className={inv.status === value && color ? color : ""}
                            disabled={respond.isPending}
                            onClick={() =>
                              respond.mutate({ id: inv.id, payload: { status: value } })
                            }
                          >
                            <Icon className="size-3.5 mr-1" />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
