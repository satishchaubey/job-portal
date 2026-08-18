import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// For GitHub Pages deployment: base must match your repo name: '/job-portal/'
export default defineConfig({
  plugins: [react()],
  base: '/job-portal/',
})

