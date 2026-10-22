import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';

// Numéro de version affiché dans le jeu : date de construction et commit (pour savoir quelle version un testeur utilise).
const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'local'; } })();
const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).slice(0, 16).replace(' ', ' ');
const define = { __APP_VERSION__: JSON.stringify(`${stamp} · ${commit}`) };

// Deux constructions :
// - par défaut (dist/) : le jeu en un seul fichier HTML autonome, images comprises (jouable hors ligne) ;
// - `--mode web` (dist-web/) : une page HTML (code et styles intégrés) et les images à côté, dans assets/.
//   C'est celle qui est publiée (GitHub Pages, artifact) : les illustrations ne sont chargées que quand elles s'affichent,
//   et la page reste sous les 16 Mo d'un artifact quelle que soit la taille de la collection.
export default defineConfig(({ mode }) => mode === 'web'
  ? {
    base: './',
    define,
    // Le code est intégré à la page : les chemins des images sont donc relatifs à la page (img/…), pas au script.
    experimental: { renderBuiltUrl: (file: string) => file },
    plugins: [react(), viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true })],
    build: { outDir: 'dist-web', assetsDir: 'img', target: 'es2022', assetsInlineLimit: 0, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } },
  }
  : {
    define,
    plugins: [react(), viteSingleFile()],
    build: { outDir: 'dist', target: 'es2022' },
  });
