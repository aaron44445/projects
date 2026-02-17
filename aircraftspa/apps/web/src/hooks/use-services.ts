"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<any[]>("/api/services"),
  });
}

export function useAddOns(serviceId: string | null) {
  return useQuery({
    queryKey: ["addons", serviceId],
    queryFn: () => apiFetch<any[]>(`/api/services/${serviceId}/addons`),
    enabled: !!serviceId,
  });
}
