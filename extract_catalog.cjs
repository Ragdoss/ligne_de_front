// Extrait le catalogue de cartes du simulateur HTML (source historique) vers des données JSON.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const grab = (start, endMarker) => { const i = html.indexOf(start); const j = html.indexOf(endMarker, i); return html.slice(i, j + endMarker.length); };
const src = [grab('const CATALOG = {', '\n};'), grab('const CARD_DESC = {', '\n};'),
  ...['EMPIRE','ELFE','DEMONS','NOMADES'].map(f => grab(`const DECK_LIST_${f} =`, '];'))].join('\n');
const out = new Function(src + '\nreturn {CATALOG, CARD_DESC, decks:{empire:DECK_LIST_EMPIRE, elfe:DECK_LIST_ELFE, demons:DECK_LIST_DEMONS, nomades:DECK_LIST_NOMADES}};')();
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(Object.keys(out.CATALOG).length, 'cartes');
