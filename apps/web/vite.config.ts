import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig(({ mode }) => {
  const { API_PORT = '3000' } = loadEnv(mode, repoRoot, 'API_')
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': `http://localhost:${API_PORT}`,
      },
    },
  }
})
