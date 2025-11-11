import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json' assert { type: 'json' }

const getBasePath = () => {
  const repositoryPath = process.env.VITE_APP_BASE_PATH ?? packageJson.name
  const repositoryName = repositoryPath?.split('/').filter(Boolean).pop()
  return repositoryName ? `/${repositoryName}/` : '/'
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? getBasePath() : '/',
  plugins: [react()],
}))
