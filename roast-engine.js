
/*
  PROTOGEN AI — OFFLINE ROAST ENGINE

  Public functions:
    ProtogenRoasts.load()
    ProtogenRoasts.getRandomRoast()
    ProtogenRoasts.getRandomRoast("Mama Jokes")
    ProtogenRoasts.getRandomRoasts(5, "Family Roasts")
    ProtogenRoasts.getCategories()
    ProtogenRoasts.searchRoasts("brother")
    ProtogenRoasts.getCount()

  First visit: loads roasts.json and saves a local copy.
  Later visits: can use the saved copy without internet.
*/

(function () {
  "use strict";

  const DATA_URL = "./roasts.json";
  const CACHE_KEY = "protogen_roasts_collection_v1";

  let roastData = [];
  let loadingPromise = null;

  function isValidCollection(data) {
    return (
      Array.isArray(data) &&
      data.length === 10000 &&
      data.every(item =>
        item &&
        typeof item.id === "number" &&
        typeof item.category === "string" &&
        typeof item.text === "string"
      )
    );
  }

  function saveOfflineCopy(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log("Protogen: roast collection saved for offline use.");
    } catch (error) {
      console.warn(
        "Protogen could not save the local roast copy. The service worker cache may still work.",
        error
      );
    }
  }

  function readOfflineCopy() {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (!saved) return null;

      const data = JSON.parse(saved);
      return isValidCollection(data) ? data : null;
    } catch (error) {
      console.warn("Protogen could not read its offline roast copy.", error);
      return null;
    }
  }

  async function load() {
    if (roastData.length === 10000) return roastData;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const response = await fetch(DATA_URL, {
          cache: "no-cache"
        });

        if (!response.ok) {
          throw new Error(`Could not load roasts.json: ${response.status}`);
        }

        const data = await response.json();

        if (!isValidCollection(data)) {
          throw new Error("roasts.json must contain exactly 10,000 valid records.");
        }

        roastData = data;
        saveOfflineCopy(data);

        console.log(`Protogen loaded ${data.length} roasts.`);
        return roastData;

      } catch (networkError) {
        console.warn("Could not fetch roast collection:", networkError);

        const saved = readOfflineCopy();

        if (saved) {
          roastData = saved;
          console.log("Protogen loaded the saved offline roast collection.");
          return roastData;
        }

        throw new Error(
          "Savage Mode has not been downloaded yet. Open Protogen once while connected to the internet, then it can be used offline."
        );

      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  function chooseRandom(items) {
    if (!items.length) return null;

    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }

  async function getRandomRoast(category = "All") {
    const data = await load();

    const filtered = category === "All"
      ? data
      : data.filter(roast => roast.category === category);

    if (!filtered.length) {
      throw new Error(`No roasts found in category: ${category}`);
    }

    return chooseRandom(filtered);
  }

  async function getRandomRoasts(count = 5, category = "All") {
    const data = await load();

    const filtered = category === "All"
      ? [...data]
      : data.filter(roast => roast.category === category);

    if (!filtered.length) return [];

    // Shuffle a copy so a batch does not repeat the same roast.
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    const safeCount = Math.max(1, Math.min(Number(count) || 1, filtered.length));
    return filtered.slice(0, safeCount);
  }

  async function getCategories() {
    const data = await load();
    return [...new Set(data.map(roast => roast.category))];
  }

  async function searchRoasts(query) {
    const data = await load();
    const searchTerm = String(query || "").trim().toLowerCase();

    if (!searchTerm) return [];

    return data.filter(roast =>
      roast.text.toLowerCase().includes(searchTerm) ||
      roast.category.toLowerCase().includes(searchTerm)
    );
  }

  async function getCount() {
    const data = await load();
    return data.length;
  }

  async function getCategoryCounts() {
    const data = await load();
    const counts = {};

    for (const roast of data) {
      counts[roast.category] = (counts[roast.category] || 0) + 1;
    }

    return counts;
  }

  // Make the engine available to Protogen's existing script.js.
  window.ProtogenRoasts = Object.freeze({
    load,
    getRandomRoast,
    getRandomRoasts,
    getCategories,
    searchRoasts,
    getCount,
    getCategoryCounts
  });

  // Register offline website caching on localhost and HTTPS hosting.
  if ("serviceWorker" in navigator &&
      (location.protocol === "https:" ||
       location.hostname === "localhost" ||
       location.hostname === "127.0.0.1")) {

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(registration => {
          console.log(
            "Protogen offline service worker ready:",
            registration.scope
          );
        })
        .catch(error => {
          console.error("Service worker registration failed:", error);
        });
    });
  }

  // Start loading immediately so the collection is ready when needed.
  load().catch(error => {
    console.warn("Savage Mode is not ready yet:", error.message);
  });

})();
