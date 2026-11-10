import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
  optimizeDeps: { include: ["react", "react-dom/client", "react/jsx-dev-runtime", "react-router-dom", "firebase/app", "firebase/auth", "firebase/firestore", "gsap", "gsap/ScrollTrigger"] },
})
