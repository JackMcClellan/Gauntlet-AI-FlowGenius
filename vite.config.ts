import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'
import path from "path"
import fs from 'fs'

// Custom plugin to copy database file
function copyDatabasePlugin() {
  return {
    name: 'copy-database',
    buildStart() {
      // For development, we'll handle the database in the main process differently
      // Just ensure the dist-electron directory exists
      const destDir = path.resolve(__dirname, 'dist-electron')
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      console.log('Database plugin initialized')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyDatabasePlugin(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}) 