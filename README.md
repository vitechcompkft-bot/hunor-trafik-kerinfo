# HUNOR Trafik-kereskedelmi info dashboard

Vitech Comp Kft. által készített dashboard a HUNOR-COOP Zrt. 17 Nemzeti Dohányboltjának (+ 119. Baks dohányrészleg) forgalmi adataihoz.

## Adatforrás

- **Bolti AIR-Firebird** → **trafik-agent** (v1.6, napi 12:00 Task Scheduler) → **NetPush proxy** → **HK sqlite** (`~/.hunor-kimutatasok/trafik.sqlite`)
- 30 nap × 3 SP × 17 trafik = ~1500 SP-hívás naponta
- 119. Baks → **bolt-agent** (v3.10) → külön dohány-blokk (PT_GEP='003')

## Build

```bash
npm ci
node scripts/build-data.js   # trafik.sqlite → public/data/trafik.json
npm run build                # Next.js static export → out/
```

## Deploy

GitHub Actions automatikusan build-eli és deploy-olja a `gh-pages`-re minden push-nál.

**Élő URL**: `https://vitechcompkft-bot.github.io/hunor-trafik-kerinfo/`

## Napi adatfrissítés

A `public/data/trafik.json` fájlt naponta 1× regenerálni kell:

```bash
node scripts/build-data.js
git add public/data/trafik.json
git commit -m "Data refresh $(date +%Y-%m-%d)"
git push
```

GitHub Actions ekkor újra build-eli és publikálja a friss verziót.
