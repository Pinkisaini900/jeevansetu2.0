import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// host:true lets your phone open the site over Wi-Fi (needed for QR scanning)
export default defineConfig({ plugins: [react()], server: { host: true, proxy: { "/api": "http://localhost:3000" } } });
