
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Genlook } from "@genlook/api";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const client = new Genlook({
  apiKey: process.env.GENLOOK_API_KEY
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP allowed."));
    }
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/try-on", upload.single("personImage"), async (req, res) => {
  try {
    if (!process.env.GENLOOK_API_KEY) {
      return res.status(500).json({ error: "API key missing." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Upload your photo." });
    }

    // Product image from local public folder
    const productPath = path.join(
      __dirname,
      "public",
      "product-dress.jpg"
    );

    if (!fs.existsSync(productPath)) {
      return res.status(404).json({
        error: "product-dress.jpg not found in public folder."
      });
    }

    console.log("Uploading customer photo...");

    // Upload customer image
    const personUpload = await client.images.upload(
      req.file.buffer,
      { mimeType: req.file.mimetype }
    );

    console.log("Customer photo uploaded.");

    // Product image is served from this public URL
    const productImageUrl =
      `http://localhost:${PORT}/product-dress.jpg`;

    // IMPORTANT:
    // Genlook needs a publicly accessible HTTPS URL.
    // localhost is NOT accessible to Genlook servers.
    // Use a public HTTPS URL for the product image here.

    console.log("Product image URL:", productImageUrl);

    const result = await client.tryOn.create({
      person: {
        image: {
          source: {
            id: personUpload.imageId
          }
        }
      },
      products: [
        {
          externalId: "saahra-dress-001",
          title: "Saahra Ivory Embroidered Dress",
          description: "Premium women's embroidered dress.",
          images: [
            {
              source: {
                url: productImageUrl
              }
            }
          ]
        }
      ]
    });

    const completed = await client.generations.waitFor(
      result.generationId
    );

    if (!completed.resultImageUrl) {
      throw new Error("Generated image URL not found.");
    }

    console.log("Try-on completed!");

    res.json({
      success: true,
      resultImageUrl: completed.resultImageUrl
    });

  } catch (error) {
    console.error("Try-on error:", error);

    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.details || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Saahra Try-On: http://localhost:${PORT}`);
});
