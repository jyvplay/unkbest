import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { nativeScraperPlugin } from "./src/lib/overrides/vite-native-scraper";

export default defineConfig({
  plugins: [nativeScraperPlugin(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") }
    ]
  }
});