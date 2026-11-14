<p align="center">
  <a href="https://warframedrops.netlify.app">
    <img src="public/assets/favicon.svg" width="128">
    <h1 align="center">Warframe Drops PWA</h1>
  </a>
</p>
<p align="center">
  <a href="https://github.com/preactjs/preact" target="_blank">
    <img src="https://img.shields.io/badge/Preact-v10.13-673ab8?style=for-the-badge&logo=preact" alt="preact version" />
  </a>&nbsp;
  <a href="https://github.com/preactjs/preact" target="_blank">
    <img src="https://img.shields.io/badge/Vite-v4.2-646CFF?style=for-the-badge&logo=vite" alt="vite version" />
  </a>&nbsp;
  <a href="https://opensource.org/license/mit/" target="_blank">
    <img src="https://img.shields.io/badge/license-mit-red?style=for-the-badge&logo=none" alt="license" />
  </a>
</p>

a warframe app that finds the best place to farm any in-game item by looking through the [official drop tables](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html) published by Digital Extremes in a simple UI, installable on supported browsers for offline usage.

## Generated Data

Build process generates the following JSON files by downloading and parsing the drop data webpage provided by Digital Extremes.

List of in-game items sorted by drop chance in descending order.

#### **`/public/data/drops.json`**

```yaml
[
  {
    "name": "Smoking Body Ephemera Blueprint",
    "place": "Shadow Stalker",
    "rarity": "Very Common",
    "chance": "5.00",
  },
  { ... },
]
```

The metadata of the current build.

#### **`/public/data/info.json`**

```yaml
{
  "hash": "6cda902094785fa79df1ec64647e746d",
  "build": "2022/06/12",
  "update": "2022/06/09",
}
```

## Scripts

here is the list of some built-in npm scripts :

```yaml
{
  "scripts": {
    "dev": "vite", // start dev server
    "build": "vite build", // build for production
    "preview": "vite preview", // preview production build
    "prebuild": "ts-node-esm generateData.ts" // generate drop data
  }
}
```

## License

MIT

## Interaktivní mapa (Star Chart)

Záložka **Mapa** v horní liště (nebo odkaz `/#mapa`) zobrazí interaktivní Star Chart:

- **Klik na planetu** → seznam nodů, **klik na node** → co tam padá, po rotacích A/B/C (cyklus A, A, B, C) se šancí a sloupcovým pruhem.
- **Jen garantované (100 %)** – přepínač v detailu nodu.
- **Vyhledávání itemu** (našeptávač, šipky + Enter) → planety se rozsvítí podle nejlepší šance:
  - **zlatá** = item padá přímo z mise,
  - **tyrkysová** = padá relikvie, která item obsahuje,
  - číslo pod planetou = nejlepší šance.
- **Prime díly přes relikvie**: relikvie → šance Intact/Radiant → nejlepší nody, kde relikvie padá. Relikvie, která v misích nepadá, je označená jako *vaultovaná*.
- Bounty (Cetus, Orb Vallis, Cambion Drift, Isolation Vaults) jsou jako „hub“ node na své planetě. Lokace mimo Star Chart (Duviri, Veil Proxima, Höllvania, Sanctuary, Dark Refractory, Ostatní) jsou chipy pod mapou.
- Nepřátelé a kontejnery jsou ve výsledcích hledání („Nepřátelé, kontejnery a ostatní“).
- Zoom kolečkem / tlačítky, posun tažením, na mobilu dvěma prsty. Stav je v URL, takže funguje tlačítko Zpět a odkazy jdou sdílet (např. `/#mapa?l=Mercury&n=Suisei`).
- Mapa funguje offline (data jsou v precache service workeru).

### Data

`npm run prebuild` stáhne drop tabulky a vygeneruje `public/data/drops.json` i kompaktní `public/data/map.json` (`buildMap.ts`). Samotnou mapu z existujícího `drops.json` přegeneruješ přes `npm run map`. Duplicitní řádky ve stejné tabulce se sčítají (max. 100 %).

Grafika mapy je vlastní vektorová (SVG), žádný herní artwork.
