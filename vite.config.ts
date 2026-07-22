import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/", // custom domain nithat.peerapongsm.dev — no basePath
  test: { environment: "jsdom" },
});
