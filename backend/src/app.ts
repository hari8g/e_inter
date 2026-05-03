import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";

export const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "e-inter API",
    version: "1.0.0",
    docs: "Mount frontend separately; API under /api/v1",
  });
});

app.use("/api/v1", apiRouter);
