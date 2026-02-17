"use client";

import { useState, useEffect } from "react";
import { useBookingStore } from "@/stores/booking-store";
import { useAirportSearch } from "@/hooks/use-airports";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Plane, Check, ChevronsUpDown } from "lucide-react";

export function Location() {
  const {
    airportId,
    airportName,
    locationType,
    locationNotes,
    setAirport,
    setLocationType,
    setLocationNotes,
  } = useBookingStore();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: airports, isLoading } = useAirportSearch(searchQuery);

  return (
    <div className="space-y-8">
      {/* Airport Search */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Select Airport Location
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Search by ICAO code, IATA code, or airport name
        </p>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full max-w-xl justify-between h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                {airportId ? (
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{airportName}</div>
                    <div className="text-xs text-gray-500">
                      {airports?.find((a: any) => a.id === airportId)?.icaoCode} •{" "}
                      {airports?.find((a: any) => a.id === airportId)?.city},{" "}
                      {airports?.find((a: any) => a.id === airportId)?.state}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Search for an airport...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type ICAO, IATA, or airport name..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery.length < 2
                    ? "Type at least 2 characters to search"
                    : isLoading
                      ? "Searching airports..."
                      : "No airports found"}
                </CommandEmpty>
                {airports && airports.length > 0 && (
                  <CommandGroup>
                    {airports.map((airport: any) => (
                      <CommandItem
                        key={airport.id}
                        value={airport.id}
                        onSelect={() => {
                          setAirport(airport.id, airport.name);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`rounded-full p-1.5 ${
                              airportId === airport.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Plane className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {airport.icaoCode || airport.iataCode}
                              </span>
                              <span className="text-sm text-gray-600 truncate">
                                {airport.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {airport.city && airport.state
                                ? `${airport.city}, ${airport.state}`
                                : airport.city || airport.state || airport.country}
                            </div>
                          </div>
                          {airportId === airport.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Location Type */}
      {airportId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Where is your aircraft?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Select the location type at the airport
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <button
              onClick={() => setLocationType("hangar")}
              className={`group rounded-lg border-2 p-6 text-left transition-all hover:shadow-md ${
                locationType === "hangar"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-full p-3 transition-colors ${
                      locationType === "hangar"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }`}
                  >
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      Hangar
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Aircraft is in a hangar or enclosed space
                    </p>
                  </div>
                </div>
                {locationType === "hangar" && (
                  <div className="rounded-full bg-blue-600 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setLocationType("ramp")}
              className={`group rounded-lg border-2 p-6 text-left transition-all hover:shadow-md ${
                locationType === "ramp"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-full p-3 transition-colors ${
                      locationType === "ramp"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }`}
                  >
                    <Plane className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Ramp</div>
                    <p className="mt-1 text-sm text-gray-600">
                      Aircraft is on the ramp or tie-down area
                    </p>
                  </div>
                </div>
                {locationType === "ramp" && (
                  <div className="rounded-full bg-blue-600 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Location Notes */}
      {airportId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label htmlFor="locationNotes">
            Additional Location Details{" "}
            <span className="text-gray-500 font-normal">(Optional)</span>
          </Label>
          <textarea
            id="locationNotes"
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            placeholder="e.g., Hangar 5, Row B, Spot 12..."
            rows={3}
            className="mt-2 w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs transition-all outline-none focus-visible:border-blue-600 focus-visible:ring-[3px] focus-visible:ring-blue-600/50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Help our team locate your aircraft quickly
          </p>
        </div>
      )}

      {/* Info Card */}
      {airportId && (
        <Card className="max-w-2xl border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-600 p-2 text-white">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Location Selected</div>
                <div className="mt-1 text-sm text-gray-600">
                  {airportName} • {locationType === "hangar" ? "Hangar" : "Ramp"}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  We&apos;ll calculate any travel fees based on this location in the next step
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
