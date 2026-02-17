"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useCreateBooking() {
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => apiFetch<any>(`/api/bookings/${id}`),
    enabled: !!id,
  });
}

export function useBookings(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.page) searchParams.set("page", params.page.toString());
      return apiFetch<any>(`/api/bookings?${searchParams}`);
    },
  });
}
