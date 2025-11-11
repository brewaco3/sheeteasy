import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryPath = process.env.VITE_APP_BASE_PATH
const base = repositoryPath ? `/${repositoryPath.split('/').pop()}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
