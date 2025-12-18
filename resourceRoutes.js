import express from "express";
import multer from "multer";
import {
  uploadResource,
  getResources,
  downloadResource
} from "../controller/resourceController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadResource);
router.get("/", getResources);
router.get("/download/:id", downloadResource);

export default router;   // ✅ THIS FIXES THE ERROR

