import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const PORT = process.env.PORT || 3001;

// Main analysis endpoint
app.post("/api/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Forward the CSV to Python ML service
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: "text/csv",
    });

    const response = await axios.post(`${ML_SERVICE_URL}/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60s — AI call can be slow
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));