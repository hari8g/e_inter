/**
 * HTTP server entry: used by `npm start` (Render, local prod) and `npm run dev`
 * (via `tsx watch`). Binds `PORT` from the host or 8787 locally.
 */
import { app } from "./app.js";

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`e-inter API listening on port ${port}`);
});
