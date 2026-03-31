import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const repo = env?.GITHUB_REPOSITORY?.split('/')[1]
const base = env?.GITHUB_ACTIONS && repo ? `/${repo}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
