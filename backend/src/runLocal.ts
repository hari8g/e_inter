/**
 * Local process entry (not a Vercel Express candidate — see `app.ts`).
 * `package.json` sets LISTEN=1 for dev/start.
 */
import { app } from "./app.js";

if (process.env.LISTEN === "1") {
  const port = Number(process.env.PORT) || 8787;
  app.listen(port, () => {
    console.log(`e-inter backend listening on http://localhost:${port}`);
  });
} else {
  console.error("Refusing to listen: set LISTEN=1 (see npm run dev / npm start in package.json).");
  process.exit(1);
}
