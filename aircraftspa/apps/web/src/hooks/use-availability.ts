"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface AvailabilityInput {
  date: string;
  serviceId: string;
  aircraftClassId: string;
  addOnIds: string[];
}

export function useAvailability(input: AvailabilityInput | null) {
  return useQuery({
    queryKey: ["availability", input],
    queryFn: () =>
      apiFetch<any[]>("/api/availability", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    enabled: !!input?.date && !!input?.serviceId && !!input?.aircraftClassId,
  });
}
