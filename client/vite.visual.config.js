import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  envDir: 'C:/Users/pwt/AppData/Local/Temp/opencode/empty-env',
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
})
