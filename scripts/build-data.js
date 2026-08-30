// Trafik-adat exportáló: trafik.sqlite → public/data/trafik.json
// Build előtt fut, a legutolsó ~60 nap adatát kigyűjti
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DB_PATH = path.join(os.homedir(), '.hunor-kimutatasok', 'trafik.sqlite');
const FORG_DB_PATH = path.join(os.homedir(), '.hunor-kimutatasok', 'forgalom.sqlite');
const OUT = path.join(__dirname, '..', 'public', 'data', 'trafik.json');

// Trafik-név mapping (Nemzeti Dohánybolt + 119 Baks dohány-részleg)
// Elég a szám (mobilra optimalizált) — a bolt-oszlop tartalmazza a teljes kódot
const TRAFIK_NEVEK = {
  '008': '8',   '010': '10',  '011': '11',  '013': '13',
  '021': '21',  '026': '26',  '030': '30',  '031': '31',
  '032': '32',  '040': '40',  '047': '47',  '050': '50',
  '055': '55',  '057': '57',  '060': '60',  '070': '70',
  '119': '119', '550': '550',
};

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

// 1) Napi adatok - utolsó 60 nap
const maxDat = db.prepare("SELECT MAX(datum) AS d FROM napi_trafik_vevoszam").get().d;
const napok = db.prepare(`
  SELECT DISTINCT datum FROM napi_trafik_vevoszam
  WHERE datum >= date(?, '-60 days') ORDER BY datum DESC
`).all(maxDat).map(r => r.datum);

const napi = {};
const OSSZES_TRAFIK = Object.keys(TRAFIK_NEVEK);  // 17 trafik teljes listája
for (const nap of napok) {
  const rows = db.prepare(`
    SELECT v.bolt, v.vevoszam, v.forgalom,
           r.arres_ne, r.arres_sz, r.keszlet_br, r.leertekeles, r.leiras_br, r.emozg_br, r.arres_veszteseg
    FROM napi_trafik_vevoszam v
    LEFT JOIN napi_trafik_reszletes r ON r.bolt=v.bolt AND r.datum=v.datum
    WHERE v.datum=? ORDER BY v.bolt
  `).all(nap);
  const rowMap = new Map(rows.map(r => [r.bolt, r]));

  // MINDEN 17 trafik szerepel, hiányzó = 0
  napi[nap] = OSSZES_TRAFIK.map(bolt => {
    const r = rowMap.get(bolt);
    if (r) return {
      bolt: r.bolt,
      nev: TRAFIK_NEVEK[r.bolt] || r.bolt,
      forgalom: r.forgalom || 0,
      vevoszam: r.vevoszam || 0,
      arres_ne: r.arres_ne || 0,
      arres_sz: r.arres_sz || 0,
      keszlet_br: r.keszlet_br || 0,
      leertekeles: r.leertekeles || 0,
      leiras_br: r.leiras_br || 0,
      emozg_br: r.emozg_br || 0,
      arres_veszteseg: r.arres_veszteseg || 0,
    };
    return {
      bolt, nev: TRAFIK_NEVEK[bolt] || bolt,
      forgalom: 0, vevoszam: 0,
      arres_ne: 0, arres_sz: 0, keszlet_br: 0,
      leertekeles: 0, leiras_br: 0, emozg_br: 0, arres_veszteseg: 0,
    };
  });
}

// 2) Havi aggregátumok + részletes havi SUM (napi_trafik_reszletes-ből) + bázis (előző év azonos hó)
const havi = {};
const honapok = db.prepare(`SELECT DISTINCT ev, honap FROM havi_trafik_bolt ORDER BY ev DESC, honap DESC LIMIT 24`).all();

// Előző év azonos hó adata a bázis-oszlophoz
function getForgBazis(ev, ho) {
  const bazisEv = ev - 1;
  const rows = db.prepare(`SELECT kod, forgalom FROM havi_trafik_bolt WHERE ev=? AND honap=?`).all(bazisEv, ho);
  return new Map(rows.map(r => [r.kod, r.forgalom || 0]));
}

for (const h of honapok) {
  const key = `${h.ev}-${String(h.honap).padStart(2, '0')}`;
  const rows = db.prepare(`
    SELECT kod, forgalom, vevoszam, keszlet_fogy, arres, arres_szint
    FROM havi_trafik_bolt WHERE ev=? AND honap=? ORDER BY kod
  `).all(h.ev, h.honap);

  // Havi részletes SUM napi_trafik_reszletes-ből (a napokra amelyek ehhez a hóhoz tartoznak)
  const honapPrefix = `${h.ev}-${String(h.honap).padStart(2, '0')}`;
  const reszRows = db.prepare(`
    SELECT bolt, SUM(leertekeles) AS le, SUM(leiras_br) AS li, SUM(emozg_br) AS em
    FROM napi_trafik_reszletes WHERE datum LIKE ? GROUP BY bolt
  `).all(honapPrefix + '%');
  const reszMap = new Map(reszRows.map(r => [r.bolt, { le: r.le || 0, li: r.li || 0, em: r.em || 0 }]));

  const bazisMap = getForgBazis(h.ev, h.honap);

  havi[key] = rows.map(r => {
    const resz = reszMap.get(r.kod) || { le: 0, li: 0, em: 0 };
    return {
      bolt: r.kod,
      nev: TRAFIK_NEVEK[r.kod] || r.kod,
      forgalom: r.forgalom || 0,
      forgalom_bazis: bazisMap.get(r.kod) || 0,
      vevoszam: r.vevoszam || 0,
      keszlet: r.keszlet_fogy || 0,
      arres: r.arres || 0,
      arres_szint: r.arres_szint || 0,
      leertekeles: resz.le,
      leiras_br: resz.li,
      emozg_br: resz.em,
    };
  });

  // 119 (Baks dohány-részleg) hozzáadása a forgalom.sqlite-ból
  try {
    const fdb = new Database(FORG_DB_PATH, { readonly: true });
    const r119 = fdb.prepare(
      `SELECT dohany_forgalom, dohany_vevoszam, dohany_arres, dohany_keszlet
       FROM havi_bolt WHERE kod='119' AND ev=? AND honap=?`
    ).get(h.ev, h.honap);
    fdb.close();
    if (r119 && (r119.dohany_forgalom > 0 || r119.dohany_vevoszam > 0)) {
      const arres_sz = r119.dohany_forgalom > 0 ? (r119.dohany_arres / r119.dohany_forgalom * 127) : 0;
      const fdb2 = new Database(FORG_DB_PATH, { readonly: true });
      const b119 = fdb2.prepare(`SELECT dohany_forgalom FROM havi_bolt WHERE kod='119' AND ev=? AND honap=?`).get(h.ev - 1, h.honap);
      fdb2.close();
      havi[key].push({
        bolt: '119',
        nev: TRAFIK_NEVEK['119'],
        forgalom: r119.dohany_forgalom || 0,
        forgalom_bazis: b119?.dohany_forgalom || 0,
        vevoszam: r119.dohany_vevoszam || 0,
        keszlet: r119.dohany_keszlet || 0,
        arres: r119.dohany_arres || 0,
        arres_szint: arres_sz,
        leertekeles: 0, leiras_br: 0, emozg_br: 0,
      });
    }
  } catch { /* ignore */ }
}

db.close();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  utolso_napi: maxDat,
  napok,
  havi_kulcsok: Object.keys(havi),
  napi,
  havi,
  trafik_nevek: TRAFIK_NEVEK,
}, null, 2), 'utf8');

console.log(`OK: ${OUT}`);
console.log(`  Napi napok: ${napok.length}, utolsó: ${maxDat}`);
console.log(`  Havi hónapok: ${honapok.length}`);
