import { useEffect, useState } from "preact/hooks";
import MapView from "./map/MapView";

export function App() {
  const [update, setUpdate] = useState("");

  useEffect(() => {
    fetch("/data/info.json")
      .then((r) => r.json())
      .then((i) => setUpdate(i.update))
      .catch(() => {});
  }, []);

  return (
    <div class="wf-app">
      <header class="wf-header">
        <a href="#" class="flex items-center gap-3 min-w-0">
          <img src="/assets/favicon.svg" class="w-9 h-9" alt="" />
          <span class="wf-title">Warframe Drop Map</span>
        </a>
        <span class="wf-muted text-xs whitespace-nowrap">
          {update && <>Data DE: {update}</>}
          {" · "}
          <a class="wf-link" href="https://github.com/farhadrezvani/warframe-drops-pwa" target="_blank" rel="noopener noreferrer">
            zdroj dat
          </a>
        </span>
      </header>
      <MapView />
    </div>
  );
}
