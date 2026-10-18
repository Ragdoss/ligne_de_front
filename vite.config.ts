import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Deux constructions :
// - par défaut (dist/) : le jeu en un seul fichier HTML autonome, images comprises (jouable hors ligne) ;
// - `--mode web` (dist-web/) : une page HTML (code et styles intégrés) et les images à côté, dans assets/.
//   C'est celle qui est publiée (GitHub Pages, artifact) : les illustrations ne sont chargées que quand elles s'affichent,
//   et la page reste sous les 16 Mo d'un artifact quelle que soit la taille de la collection.
export default defineConfig(({ mode }) => mode === 'web'
  ? {
    base: './',
    // Le code est intégré à la page : les chemins des images sont donc relatifs à la page (img/…), pas au script.
    experimental: { renderBuiltUrl: (file: string) => file },
    plugins: [react(), viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true })],
    build: { outDir: 'dist-web', assetsDir: 'img', target: 'es2022', assetsInlineLimit: 0, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } },
  }
  : {
    plugins: [react(), viteSingleFile()],
    build: { outDir: 'dist', target: 'es2022' },
  });
