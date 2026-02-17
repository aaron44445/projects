"use client";

import { useState, useRef } from "react";
import { Camera, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface Photo {
  id: string;
  url: string;
  type: "before" | "after";
  caption: string | null;
  createdAt: string;
}

const MOCK_PHOTOS: Photo[] = [
  {
    id: "photo_01",
    url: "https://placehold.co/400x300/e2e8f0/475569?text=Before+1",
    type: "before",
    caption: "Exterior - left side",
    createdAt: new Date().toISOString(),
  },
  {
    id: "photo_02",
    url: "https://placehold.co/400x300/e2e8f0/475569?text=Before+2",
    type: "before",
    caption: "Interior - cabin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "photo_03",
    url: "https://placehold.co/400x300/dcfce7/166534?text=After+1",
    type: "after",
    caption: "Exterior - left side cleaned",
    createdAt: new Date().toISOString(),
  },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-12 text-center">
      <ImageIcon className="mb-3 h-12 w-12 text-gray-300" />
      <h3 className="text-sm font-semibold text-gray-600">No photos yet</h3>
      <p className="mt-1 text-xs text-gray-400">
        Tap the camera button to capture photos
      </p>
    </div>
  );
}

function PhotoCard({
  photo,
  onDelete,
  onCaptionChange,
}: {
  photo: Photo;
  onDelete: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (confirmDelete) {
      onDelete(photo.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={photo.url}
          alt={photo.caption || "Job photo"}
          className="h-full w-full object-cover"
        />
        <Button
          variant={confirmDelete ? "destructive" : "secondary"}
          size="icon-xs"
          className="absolute right-1.5 top-1.5 opacity-80 hover:opacity-100"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {confirmDelete && (
          <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-xs font-medium text-white">
            Tap again to delete
          </div>
        )}
      </div>
      <CardContent className="p-2">
        <Input
          placeholder="Add caption..."
          value={photo.caption || ""}
          onChange={(e) => onCaptionChange(photo.id, e.target.value)}
          className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
        />
      </CardContent>
    </Card>
  );
}

export default function JobPhotos({ bookingId }: { bookingId: string }) {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("before");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  function handleCapture() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Log the file for now; actual upload will use the API
    console.log("File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      bookingId,
      photoType: activeTab,
    });

    // Simulate upload with progress
    setUploading(true);
    setTimeout(() => {
      const newPhoto: Photo = {
        id: `photo_${Date.now()}`,
        url: URL.createObjectURL(file),
        type: activeTab as "before" | "after",
        caption: null,
        createdAt: new Date().toISOString(),
      };
      setPhotos((prev) => [newPhoto, ...prev]);
      setUploading(false);
    }, 1500);

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleDelete(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCaptionChange(id: string, caption: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  }

  const currentPhotos = activeTab === "before" ? beforePhotos : afterPhotos;

  return (
    <div className="space-y-4">
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="before">
              Before ({beforePhotos.length})
            </TabsTrigger>
            <TabsTrigger value="after">
              After ({afterPhotos.length})
            </TabsTrigger>
          </TabsList>

          <Button
            size="sm"
            onClick={handleCapture}
            disabled={uploading}
            className="gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Capture
              </>
            )}
          </Button>
        </div>

        <TabsContent value="before" className="mt-4">
          {beforePhotos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {beforePhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onDelete={handleDelete}
                  onCaptionChange={handleCaptionChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="after" className="mt-4">
          {afterPhotos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {afterPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onDelete={handleDelete}
                  onCaptionChange={handleCaptionChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload progress overlay */}
      {uploading && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Uploading photo...
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
