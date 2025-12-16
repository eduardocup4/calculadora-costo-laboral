import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // CRÍTICO: Asegura que la app busque los archivos en la raíz (evita pantalla blanca en deploy)
  base: '/', 
  server: {
    port: 3000,
    open: true,
    host: true // Permite ver la app en tu red local (celular, etc.)
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Útil para depurar, puedes ponerlo en false si quieres ahorrar espacio
    chunkSizeWarningLimit: 1000 // Aumenta el límite de advertencia de tamaño de archivo
  }
})
