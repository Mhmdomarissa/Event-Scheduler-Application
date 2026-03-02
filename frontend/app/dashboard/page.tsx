"use client";

import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/features/events/components/EventCard";
import { EventFormDialog } from "@/features/events/components/EventFormDialog";
import { EventFiltersBar } from "@/features/events/components/EventFilters";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { useEvents } from "@/features/events/hooks";
import type { EventFilters } from "@/types";

export default function DashboardPage() {
  const [filters, setFilters] = useState<EventFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useEvents(filters);
  const events = data?.data ?? [];

  return (
    <AppShell>
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <PageHeader
          icon={<Calendar className="size-5 text-primary" />}
          title="My Events"
          description="Manage and track all your scheduled events"
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Event
            </Button>
          }
        />

        <EventFiltersBar filters={filters} onFiltersChange={setFilters} />

        {isLoading && <LoadingSkeleton variant="card" rows={6} />}

        {isError && (
          <ErrorMessage
            error={error}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && events.length === 0 && (
          <EmptyState
            icon={<Calendar className="size-8" />}
            title="No events yet"
            description="Create your first event and start inviting people."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1 size-4" /> Create Event
              </Button>
            }
          />
        )}

        {!isLoading && events.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {data?.meta && (
          <p className="text-center text-sm text-muted-foreground">
            Showing {events.length} of {data.meta.total} events
          </p>
        )}
      </div>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppShell>
  );
}
