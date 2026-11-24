import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
const PYTHON_MODEL_SERVICE_URL =
  process.env.PYTHON_MODEL_SERVICE_URL || "http://localhost:8000";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// CORS – allow configured origins
app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

// JSON body parser
app.use(express.json());

// ---------------------------------------------------------------------------
// Multer – multipart / image uploads (memory storage, 10 MB limit)
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only jpeg, jpg, png, and webp images are allowed"
        )
      );
    }
  },
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/health – simple liveness probe
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "drishti-ai-backend",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/model/status – check if Python model service is reachable
app.get("/api/model/status", async (_req, res, next) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${PYTHON_MODEL_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return res.json({
        available: true,
        modelName: "currency-cnn-v1",
        lastChecked: new Date().toISOString(),
        message: "AI model service is connected and ready",
      });
    }

    return res.json({
      available: false,
      modelName: "currency-cnn-v1",
      lastChecked: new Date().toISOString(),
      message: "AI model service returned an unexpected status",
    });
  } catch {
    return res.json({
      available: false,
      modelName: "currency-cnn-v1",
      lastChecked: new Date().toISOString(),
      message: "AI model service is not connected",
    });
  }
});

// POST /api/predict – forward image to the Python model service
app.post("/api/predict", upload.single("image"), async (req, res, next) => {
  try {
    // 1. Validate that an image was actually uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file uploaded. Please attach an image in the 'image' field.",
      });
    }

    // 2. Build a multipart/form-data body to forward to the Python service
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append("image", blob, req.file.originalname);

    // 3. Forward to the Python model service
    let response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 s

      response = await fetch(`${PYTHON_MODEL_SERVICE_URL}/predict`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      return res.status(503).json({
        success: false,
        error:
          "AI model service is not available. Please use Demo Mode.",
      });
    }

    // 4. Parse the response from the model service
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return res.status(502).json({
        success: false,
        error: "AI model service returned an error. Please try again later.",
      });
    }

    const prediction = await response.json();

    // 5. Handle uncertain predictions
    const denomination =
      prediction.denomination ?? prediction.label ?? "uncertain";
    const confidence = prediction.confidence ?? 0;

    return res.json({
      success: true,
      data: {
        denomination:
          confidence < 0.5 ? "uncertain" : denomination,
        confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Error-handling middleware
// ---------------------------------------------------------------------------

// Multer-specific errors
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size is 10 MB.",
      LIMIT_UNEXPECTED_FILE:
        err.message || "Only jpeg, jpg, png, and webp images are allowed.",
    };
    return res.status(400).json({
      success: false,
      error: messages[err.code] || err.message,
    });
  }
  next(err);
});

// 404 handler – must be registered after all routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "The requested resource was not found.",
  });
});

// Global error handler – don't leak internal details
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: "An internal server error occurred. Please try again later.",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`🚀  Drishti AI backend listening on http://localhost:${PORT}`);
  console.log(`🤖  Python model service URL: ${PYTHON_MODEL_SERVICE_URL}`);
});

// Keep server alive — catch unhandled rejections so multer parse errors don't crash the process
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept alive):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (server kept alive):', reason);
});
