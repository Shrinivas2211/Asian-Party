import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 监听 0.0.0.0，这样手机连同一 WiFi 就能用 http://<你的IP>:5173 打开
    host: true,
  },
})
