import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Le jeu est construit en un seul fichier HTML autonome (publiable tel quel, jouable hors ligne).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', target: 'es2022' },
});
