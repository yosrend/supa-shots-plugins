import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: false, // Disable public dir to avoid conflict
  build: {
    // Output to dist folder first, then we'll copy
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        // All output will be inlined by viteSingleFile
        // Use IIFE format for Figma plugin compatibility
        format: 'iife',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: true,
      },
    },
    // Inline all assets as base64
    assetsInlineLimit: 100000000,
    // Generate sourcemaps for debugging
    sourcemap: false,
    // Use esbuild for minification (default, no extra install needed)
    minify: 'esbuild',
    // Target older browsers for better iframe compatibility
    target: 'es2019',
  },
})
