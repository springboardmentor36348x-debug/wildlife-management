import React, { useEffect, useRef, useState } from "react";

// Module-level cache so the same species name is never fetched twice,
// even across re-renders or filtering/searching.
const imageCache = new Map();

async function fetchWikipediaThumbnail(name) {
  if (!name) return null;
  if (imageCache.has(name)) return imageCache.get(name);

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const url = data.thumbnail?.source || null;
    imageCache.set(name, url);
    return url;
  } catch {
    imageCache.set(name, null);
    return null;
  }
}

function SpeciesImage({ commonName, scientificName, fallbackLetter }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [imgUrl, setImgUrl] = useState(undefined);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      let url = await fetchWikipediaThumbnail(commonName);
      if (!url) url = await fetchWikipediaThumbnail(scientificName);
      if (!cancelled) setImgUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, commonName, scientificName]);

  if (imgUrl && !broken) {
    return (
      <img
        ref={ref}
        className="species-card-img"
        src={imgUrl}
        alt={commonName || scientificName}
        onError={() => setBroken(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div ref={ref} className="species-card-img-fallback">
      {fallbackLetter}
    </div>
  );
}

export default SpeciesImage;