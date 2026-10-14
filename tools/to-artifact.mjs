// Transforme dist/index.html (document complet) en page « artifact » : titre, styles, racine et script, sans squelette.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map(m => m[0]).join('\n');
const title = pick(/<title>[\s\S]*?<\/title>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
writeFileSync('dist/ligne-de-front.html', `${title}\n${styles}\n<div id="root"></div>\n${scripts}\n`);
console.log('dist/ligne-de-front.html', Math.round(readFileSync('dist/ligne-de-front.html').length / 1024), 'Ko');
