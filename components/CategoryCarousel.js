"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const Arrow = ({ dir }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
  </svg>
);

// cards: [{ key, label, cta, count, image }]  (la primera se muestra destacada)
export default function CategoryCarousel({ cards, activeKey, onPick }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, cards.length]);

  const move = dir => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <>
      <div className="section-head">
        <h2 className="big-title">Categorías</h2>
        <div className="carousel-btns">
          <button type="button" className="circle-btn" onClick={() => move(-1)}
            disabled={edge.start} aria-label="Anterior"><Arrow dir="left" /></button>
          <button type="button" className="circle-btn" onClick={() => move(1)}
            disabled={edge.end} aria-label="Siguiente"><Arrow dir="right" /></button>
        </div>
      </div>

      <div className="cat-track" ref={track} onScroll={update}>
        {cards.map((c, i) => {
          const feature = i === 0;
          const title = (
            <span className="cat-title">{c.label}<sup>{c.count}</sup></span>
          );
          return (
            <button
              key={c.key}
              type="button"
              className={"cat-card" + (feature ? " feature" : "") + (c.key === activeKey ? " active" : "")}
              onClick={() => onPick(c.key)}
            >
              <div className="cat-media">
                {c.image ? <img src={c.image} alt="" loading="lazy" /> : <div className="cat-placeholder" />}
                {feature && (
                  <div className="cat-overlay">
                    {title}
                    <span className="cat-cta">{c.cta}</span>
                  </div>
                )}
              </div>
              {!feature && (
                <div className="cat-info">
                  {title}
                  <span className="cat-cta">{c.cta}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
