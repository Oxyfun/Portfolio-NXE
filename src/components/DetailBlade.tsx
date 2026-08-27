/**
 * Panneau de détail — la « lame » NXE (cf. image3, image5).
 * Elle ne glisse pas depuis le côté : elle se déplie depuis son bandeau titre.
 */

import { useEffect, useRef, useState } from "react";
import { firstAvailable } from "../lib/assets";
import { GlyphMark } from "../lib/glyphs";
import type { Tile } from "../data/content";

function Stars({ n = 5 }: { n?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    firstAvailable("/nxe/redstar.png").then((r) => alive && setSrc(r));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="blade-stars" aria-hidden>
      {Array.from({ length: n }, (_, i) =>
        src ? <img key={i} src={src} alt="" /> : <span key={i}>★</span>,
      )}
    </div>
  );
}

interface Props {
  tile: Tile;
  activeRow: number;
  onRowChange(i: number): void;
  onActivate(i: number): void;
  onClose(): void;
  /** Colonne qui a la main : la liste d'actions ou le panneau de détail. */
  zone: "liste" | "detail";
  onZone(z: "liste" | "detail"): void;
}

export function DetailBlade({
  tile,
  activeRow,
  onRowChange,
  onActivate,
  onClose,
  zone,
  onZone,
}: Props) {
  const corps = useRef<HTMLDivElement>(null);

  /* Quand le panneau prend la main, on lui donne le focus : les flèches le font
     alors défiler nativement, sans qu'on ait à réimplémenter le défilement. */
  useEffect(() => {
    if (zone === "detail") corps.current?.focus({ preventScroll: true });
    else corps.current?.blur();
  }, [zone]);
  const { detail } = tile;
  // Casse d'origine : la référence n'affiche pas les titres en capitales.
  const heading = detail.heading ?? tile.title;

  return (
    <div
      className="blade-layer"
      role="dialog"
      aria-modal="true"
      aria-label={tile.title}
    >
      <button
        className="blade-scrim"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Fermer"
      />

      {/* `display: contents` sur grand écran : les deux lames restent
          positionnées par rapport à .blade-layer. Sur mobile, ce conteneur
          devient la feuille défilante qui les empile. */}
      <div className="blade-sheet">
        <section className="blade">
          <div className="blade-inner">
            <div className="blade-title">{heading}</div>

            <div className="blade-stats">
              <div className="blade-thumb">
                <GlyphMark glyph={tile.glyph} />
              </div>
              <dl className="blade-stat-list">
                <dt>Rep</dt>
                <dd>
                  <Stars />
                </dd>
                {detail.stats.map((s) => (
                  <div key={s.label} style={{ display: "contents" }}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {detail.rows.length > 0 && (
              <ul className="blade-rows" onClick={() => onZone("liste")}>
                {detail.rows.map((row, i) => (
                  <li key={row.label}>
                    {row.href ? (
                      <a
                        className={`blade-row${i === activeRow ? " is-active" : ""}`}
                        href={row.href}
                        target={
                          row.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel="noreferrer"
                        onMouseEnter={() => onRowChange(i)}
                      >
                        {row.label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={`blade-row${i === activeRow ? " is-active" : ""}`}
                        onMouseEnter={() => onRowChange(i)}
                        onClick={() => onActivate(i)}
                      >
                        {row.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Panneau arrière, comme sur image5 : bandeau visuel, ligne « À propos »,
          corps de texte, puis une ligne de bas de panneau. */}
        <section
          className={`blade is-secondary${zone === "detail" ? " is-active" : ""}`}
          onClick={() => onZone("detail")}
        >
          <div className="blade-inner">
            {/* Avec image : bandeau visuel, titre posé dessus (image8).
              Sans image : titre seul (image10 — son panneau arrière commence
              directement par « Achievement Progress », sans bandeau). On rendait
              le bandeau dans les deux cas, ce qui donnait une bande noire vide
              surmontée d'un titre qui semblait mal placé. */}
            {tile.image ? (
              <div
                className="blade-hero"
                style={{ backgroundImage: `url("${tile.image}")` }}
              >
                <span>{tile.title}</span>
              </div>
            ) : (
              <h2 className="blade-heading">{tile.title}</h2>
            )}

            {/* Le bloc « À propos » encastré n'existe que lorsqu'il y a une image
              (image8). Sans image, la référence pose le titre et son sous-titre
              directement sur la surface du panneau (image10) — c'est cette
              boîte plus sombre que la nôtre qui donnait l'impression d'un trou
              noir au milieu du détail. */}
            {tile.image ? (
              <div className="blade-about">
                <span className="blade-about-mark">
                  <GlyphMark glyph={tile.glyph} />
                </span>
                <span>
                  <strong>À propos — {tile.title}</strong>
                  <em>{tile.subtitle}</em>
                </span>
              </div>
            ) : (
              <p className="blade-sub">{tile.subtitle}</p>
            )}

            {/* `tabIndex` pour que le corps soit atteignable au clavier : une
              fois focalisé, les flèches le font défiler nativement, et la
              molette marche déjà grâce à `overflow-y: auto`. */}
            <div className="blade-body" tabIndex={0} ref={corps}>
              {detail.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="blade-foot">
              <span>Section</span>
              <span>{detail.stats[0]?.value ?? tile.subtitle}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
