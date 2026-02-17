"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface PricingInput {
  aircraftClassId: string;
  serviceId: string;
  addOnIds: string[];
  airportId: string;
  scheduledDate?: string;
}

export function usePricing(input: PricingInput | null) {
  return useQuery({
    queryKey: ["pricing", input],
    queryFn: () =>
      apiFetch<any>("/api/pricing/calculate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    enabled: !!input?.aircraftClassId && !!input?.serviceId && !!input?.airportId,
    staleTime: 30 * 1000,
  });
}
