"use client";

import { useForm } from "react-hook-form";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EventFilters } from "@/types";

interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
}

export function EventFiltersBar({ filters, onFiltersChange }: EventFiltersProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<EventFilters>({
    defaultValues: filters,
  });

  const onSubmit = (data: EventFilters) => {
    // Remove empty strings
    const clean: EventFilters = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    );
    onFiltersChange(clean);
  };

  const currentStatus = watch("status");
  const hasFilters = Object.values(filters).some(Boolean);

  const clearAll = () => {
    reset({});
    onFiltersChange({});
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card"
    >
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search events…"
          className="pl-8"
          {...register("search")}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(onSubmit)()}
        />
      </div>

      <Input
        type="text"
        placeholder="Location"
        className="w-36"
        {...register("location")}
      />

      <Select
        value={currentStatus ?? ""}
        onValueChange={(v) => {
          setValue("status", v as EventFilters["status"]);
          handleSubmit(onSubmit)();
        }}
      >
        <SelectTrigger className="w-32">
          <SlidersHorizontal className="size-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="ongoing">Ongoing</SelectItem>
          <SelectItem value="past">Past</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Input type="date" className="w-36 text-sm" {...register("startFrom")} />
        <span className="text-xs text-muted-foreground">–</span>
        <Input type="date" className="w-36 text-sm" {...register("startTo")} />
      </div>

      <Button type="submit" size="sm">Apply</Button>

      {hasFilters && (
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          <X className="size-3.5 mr-1" /> Clear
        </Button>
      )}
    </form>
  );
}
