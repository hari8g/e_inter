/**
 * Vercel serverless entry: all HTTP traffic is routed to the Express app.
 * @see https://vercel.com/docs/functions/serverless-functions/runtimes/node-js
 */
import { app } from "../src/app.js";

export default app;
