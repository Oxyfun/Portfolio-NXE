/**
 * Panneau de détail - la « lame » NXE (cf. image3, image5).
 * Elle ne glisse pas depuis le côté : elle se déplie depuis son bandeau titre.
 */

import { useEffect, useRef } from "react";
import { GlyphMark } from "../lib/glyphs";
import { Defilement } from "./Defilement";
import type { Tile } from "../data/content";

interface Props {
  tile: Tile;
  activeRow: number;
  onRowChange(i: number): void;
  onActivate(i: number): void;
  onClose(): void;
  /** Colonne qui a la main : la liste d'actions ou le panneau de détail. */
  zone: "liste" | "detail";
  onZone(z: "liste" | "detail"): void;
  /** Libellé de la section, affiché en pied du panneau de détail. */
  section: string;
}

export function DetailBlade({
  tile,
  activeRow,
  onRowChange,
  onActivate,
  onClose,
  zone,
  onZone,
  section,
}: Props) {
  const corps = useRef<HTMLDivElement>(null);

  /* La liste défile quand elle est plus longue que la lame - cinq entrées et
     quatre stats ne tiennent pas dans les proportions du NXE. On ramène alors
     l'entrée sélectionnée dans la vue : sans ça, la navigation au clavier
     sortait de l'écran sans que rien ne suive. */
  const liste = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = liste.current;
    if (!ul || ul.scrollHeight <= ul.clientHeight + 1) return;
    const actif = ul.querySelector(".blade-row.is-active");
    actif?.scrollIntoView({ block: "nearest" });
  }, [activeRow]);

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
                {detail.stats.map((s) => (
                  <div key={s.label} style={{ display: "contents" }}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {detail.rows.length > 0 && (
              /* Conteneur positionné : la piste de défilement se cale dessus,
                 pas sur toute la lame. */
              <div className="defil-zone">
                <ul className="blade-rows" ref={liste} onClick={() => onZone("liste")}>
                {detail.rows.map((row, i) => (
                  <li key={row.label}>
                    {row.href ? (
                      <a
                        className={`blade-row${i === activeRow ? " is-active" : ""}`}
                        href={row.href}
                        target={
                          row.href.startsWith("http") ? "_blank" : undefined
                        }
                        /* Un fichier servi par le site (le CV) se TÉLÉCHARGE au
                           lieu de remplacer la page : sans ça on quittait le
                           portfolio pour afficher un PDF, et « Télécharger mon
                           CV » ne téléchargeait rien. Les `mailto:` et `tel:`
                           n'ont évidemment rien à faire ici. */
                        download={
                          row.href.startsWith("/") && /\.[a-z0-9]{2,4}$/i.test(row.href)
                            ? ""
                            : undefined
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
                <Defilement cible={liste} />
              </div>
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
              Sans image : titre seul (image10 - son panneau arrière commence
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
              directement sur la surface du panneau (image10) - c'est cette
              boîte plus sombre que la nôtre qui donnait l'impression d'un trou
              noir au milieu du détail. */}
            {tile.image ? (
              <div className="blade-about">
                <span className="blade-about-mark">
                  <GlyphMark glyph={tile.glyph} />
                </span>
                <span>
                  <strong>À propos de {tile.title}</strong>
                  <em>{tile.subtitle}</em>
                </span>
              </div>
            ) : (
              <p className="blade-sub">{tile.subtitle}</p>
            )}

            {/* `tabIndex` pour que le corps soit atteignable au clavier : une
              fois focalisé, les flèches le font défiler nativement, et la
              molette marche déjà grâce à `overflow-y: auto`. */}
            {detail.bars && detail.bars.length > 0 && (
              <div className="blade-bars">
                {detail.bars.map((bar) => {
                  const plein = `${Math.max(0, Math.min(1, bar.ratio)) * 100}%`;
                  return (
                    <div className="blade-bar" key={bar.label}>
                      <span className="blade-bar-label">{bar.label}</span>
                      <span
                        className="blade-bar-piste"
                        style={{ ["--plein" as string]: plein }}
                      >
                        <span className="blade-bar-plein" style={{ width: plein }} />
                        {/* La valeur est centrée sur TOUTE la piste - c'est le
                            relevé d'image10 (piste 1664→2022, texte centré sur
                            1850, centre de piste 1843). Mais la référence ne
                            montre que des remplissages courts : à 62 % le blanc
                            passe sur le vert et tombe à 2.53:1 de contraste,
                            illisible. On en dessine donc deux exemplaires
                            superposés, l'un sombre découpé à la largeur du
                            remplissage. Le centrage relevé est conservé et le
                            texte reste lisible quel que soit le ratio. */}
                        <span className="blade-bar-valeur">{bar.value}</span>
                        <span className="blade-bar-valeur is-sur-plein" aria-hidden>
                          {bar.value}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="defil-zone">
              <div className="blade-body" tabIndex={0} ref={corps}>
                {detail.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <Defilement cible={corps} />
            </div>
            {/* Pied présent seulement AVEC une image, comme sur image8 ;
                image10, qui n'en a pas, n'en montre aucun. Il affichait la
                section, redondant avec le fil d'Ariane juste au-dessus. */}
            {tile.image && (
              <div className="blade-foot">
                <span>Section</span>
                <span>{section}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
