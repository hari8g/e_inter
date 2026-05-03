import { app } from "./app.js";

export default app;

/** Local / `npm start`: set `LISTEN=1` (see package.json). Vercel invokes the default export only. */
if (process.env.LISTEN === "1") {
  const port = Number(process.env.PORT) || 8787;
  app.listen(port, () => {
    console.log(`e-inter backend listening on http://localhost:${port}`);
  });
}
