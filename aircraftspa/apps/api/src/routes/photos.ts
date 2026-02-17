import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { uploadPhoto, deletePhoto } from "../services/cloudinary";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

export const photosRouter = Router();

// POST /api/photos/upload -- upload a job photo
photosRouter.post("/upload", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file provided" });

    const { bookingId, type, caption } = req.body;
    if (!bookingId || !type) {
      return res.status(400).json({ success: false, error: "bookingId and type are required" });
    }

    if (!["before", "after"].includes(type)) {
      return res.status(400).json({ success: false, error: "Type must be 'before' or 'after'" });
    }

    const { url, publicId } = await uploadPhoto(req.file.buffer, `jobs/${bookingId}/${type}`);

    const photo = await prisma.jobPhoto.create({
      data: { bookingId, url, publicId, type, caption: caption || null },
    });

    res.status(201).json({ success: true, data: photo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/photos/booking/:bookingId -- list photos for a booking
photosRouter.get("/booking/:bookingId", requireAuth, async (req, res) => {
  try {
    const photos = await prisma.jobPhoto.findMany({
      where: { bookingId: req.params.bookingId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch photos";
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/photos/:id -- delete a photo
photosRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const photo = await prisma.jobPhoto.findUnique({ where: { id: req.params.id } });
    if (!photo) return res.status(404).json({ success: false, error: "Photo not found" });

    await deletePhoto(photo.publicId);
    await prisma.jobPhoto.delete({ where: { id: req.params.id } });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete photo";
    res.status(500).json({ success: false, error: message });
  }
});
