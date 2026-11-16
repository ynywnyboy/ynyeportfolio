import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    // Explicit old targets. 'defaults' resolves to current browsers (safari 27) so preset-env
    // would transpile nothing — the legacy chunk kept ?? and the white screen survived.
    legacy({
      targets: [
        'safari 14',
        'ios_saf 14',
        'chrome 64',
        'firefox 60',
        'samsung 14',
        'and_chr 90',
        'edge 79',
      ],
      modernPolyfills: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 500,
  },
})