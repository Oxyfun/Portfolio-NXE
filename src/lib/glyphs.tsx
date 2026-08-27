/**
 * Glyphes de tuiles.
 *
 * Les cinq icônes NXE d'origine sont servies telles quelles (PNG). Pour les
 * sections qui n'ont pas d'équivalent, on dessine des formes SVG dans le même
 * langage — épaisses, coins très arrondis — auxquelles on applique le même
 * traitement : dégradé blanc → vert-jaune, reflet inversé, ombre portée.
 *
 * Le dégradé est relevé au pixel sur icon_picturelib.png (SPEC § 2.7).
 */

import { useEffect, useState } from "react";
import { firstAvailable, iconCandidates } from "./assets";
import type { GlyphId } from "../data/content";

/**
 * Les chemins sont dessinés dans une boîte locale de 120 × 120, puis placés
 * dans un canevas au MÊME format que les PNG NXE (207 × 288 → 145 × 202 ici) et
 * à la même proportion : glyphe dans la bande 7 %–65 % de la hauteur, reflet en
 * dessous. Sans ça, un glyphe SVG et une icône d'origine ne font pas la même
 * taille sur la tuile — c'était visible au premier coup d'œil.
 */
const VB = 120;
const CANVAS_W = 145;
const CANVAS_H = 202;
const GLYPH_TOP = 14.7; // 0.073 × 202
const GLYPH_SCALE = 0.975; // 117 / 120, soit 58 % de la hauteur du canevas
const MIRROR_Y = 247.5; // 2 × (GLYPH_TOP + 120 × GLYPH_SCALE) − GLYPH_TOP

type Shape = {
  fills?: string[];
  strokes?: { d: string; w: number }[];
  evenOdd?: boolean;
};

const SHAPES: Record<string, Shape> = {
  home: {
    fills: [
      "M60 13 L112 58a7 7 0 0 1-4.6 12.3H101V104a6 6 0 0 1-6 6H75V85a7 7 0 0 0-7-7H52a7 7 0 0 0-7 7v25H25a6 6 0 0 1-6-6V70.3h-6.4A7 7 0 0 1 8 58Z",
    ],
  },
  cloud: {
    fills: [
      "M38 100a25 25 0 0 1-3.4-49.8 31 31 0 0 1 58.7-6.7A23 23 0 0 1 90 100Z",
    ],
  },
  terminal: {
    strokes: [
      { d: "M26 32 L60 60 L26 88", w: 16 },
      { d: "M70 90 H100", w: 15 },
    ],
  },
  school: {
    fills: [
      "M60 14 116 44 60 74 4 44Z",
      "M30 56v22c0 11 13.5 19 30 19s30-8 30-19V56L60 71Z",
      "M104 52v30a5 5 0 0 1-10 0V52Z",
    ],
  },
  mail: {
    evenOdd: true,
    fills: [
      "M14 32h92a9 9 0 0 1 9 9v40a9 9 0 0 1-9 9H14a9 9 0 0 1-9-9V41a9 9 0 0 1 9-9Z",
      "M17 43 60 74 103 43v10L60 84 17 53Z",
    ],
  },
  server: {
    evenOdd: true,
    fills: [
      "M16 18h88a9 9 0 0 1 9 9v18a9 9 0 0 1-9 9H16a9 9 0 0 1-9-9V27a9 9 0 0 1 9-9Z",
      "M92 30a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
      "M16 62h88a9 9 0 0 1 9 9v18a9 9 0 0 1-9 9H16a9 9 0 0 1-9-9V71a9 9 0 0 1 9-9Z",
      "M92 74a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
    ],
  },
  search: {
    strokes: [
      { d: "M52 22a30 30 0 1 1 0 60 30 30 0 0 1 0-60Z", w: 14 },
      { d: "M75 75 L102 102", w: 16 },
    ],
  },
  keyboard: {
    evenOdd: true,
    fills: [
      "M12 32h96a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10H12A10 10 0 0 1 2 78V42a10 10 0 0 1 10-10Z",
      "M22 44h12v10H22Zm20 0h12v10H42Zm20 0h12v10H62Zm20 0h14v10H82ZM22 60h12v10H22Zm20 0h48v10H42Z",
    ],
  },
};

function GlyphSvg({ id }: { id: string }) {
  const shape = SHAPES[id] ?? SHAPES.home;
  const gid = `nxeg-${id}`;
  /* Avec `evenodd`, les sous-chemins doivent être dans UN SEUL `d` pour se
     percer mutuellement : en `<path>` séparés, chacun est rempli isolément et
     les trous (touches du clavier, œillets du serveur) disparaissent. */
  const fills =
    shape.evenOdd && shape.fills ? [shape.fills.join(" ")] : shape.fills;

  const body = (
    <>
      {fills?.map((d, i) => (
        <path
          key={`f${i}`}
          d={d}
          fill={`url(#${gid}-grad)`}
          fillRule={shape.evenOdd ? "evenodd" : "nonzero"}
        />
      ))}
      {shape.strokes?.map((s, i) => (
        <path
          key={`s${i}`}
          d={s.d}
          fill="none"
          stroke={`url(#${gid}-grad)`}
          strokeWidth={s.w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      role="presentation"
      focusable="false"
    >
      <defs>
        {/* Dégradé relevé sur icon_picturelib.png */}
        <linearGradient id={`${gid}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaeaea" />
          <stop offset="22%" stopColor="#f4f4f4" />
          <stop offset="42%" stopColor="#eeeeee" />
          <stop offset="54%" stopColor="#d9ddc2" />
          <stop offset="66%" stopColor="#bcc97d" />
          <stop offset="80%" stopColor="#bad23f" />
          <stop offset="92%" stopColor="#bfdc27" />
          <stop offset="100%" stopColor="#c6e71a" />
        </linearGradient>
        <linearGradient id={`${gid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${gid}-mask`}>
          <rect
            x="0"
            y={GLYPH_TOP + VB * GLYPH_SCALE}
            width={CANVAS_W}
            height={CANVAS_H}
            fill={`url(#${gid}-fade)`}
          />
        </mask>
        <filter id={`${gid}-sh`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#1d3a04"
            floodOpacity="0.55"
          />
        </filter>
      </defs>

      <g
        filter={`url(#${gid}-sh)`}
        transform={`translate(14 ${GLYPH_TOP}) scale(${GLYPH_SCALE})`}
      >
        {body}
      </g>

      {/* Reflet inversé sous le glyphe, comme dans les PNG d'origine. */}
      <g
        mask={`url(#${gid}-mask)`}
        transform={`translate(14 ${MIRROR_Y}) scale(${GLYPH_SCALE} ${-GLYPH_SCALE})`}
      >
        {body}
      </g>
    </svg>
  );
}

/** Glyphe d'une tuile : PNG NXE ou override si dispo, sinon SVG généré. */
export function NxeGlyph({ glyph }: { glyph: GlyphId }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    firstAvailable(...iconCandidates(glyph)).then((r) => alive && setSrc(r));
    return () => {
      alive = false;
    };
  }, [glyph]);

  if (src === undefined) return null; // sonde en cours — évite un flash de SVG
  if (src) return <img src={src} alt="" draggable={false} />;
  return <GlyphSvg id={glyph} />;
}

/**
 * Version compacte pour la vignette du panneau de détail. Quand le glyphe est
 * une icône NXE d'origine, on réutilise le PNG en recadrant sur sa partie haute
 * (le fichier contient aussi le reflet, qui n'a rien à faire dans une vignette).
 */
export function GlyphMark({ glyph }: { glyph: GlyphId }) {
  const [png, setPng] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    firstAvailable(...iconCandidates(glyph)).then((r) => alive && setPng(r));
    return () => {
      alive = false;
    };
  }, [glyph]);

  if (png) {
    return (
      <span className="glyph-mark-png">
        <img src={png} alt="" draggable={false} />
      </span>
    );
  }

  const shape = SHAPES[glyph];
  if (!shape) return png === undefined ? null : <span aria-hidden>▣</span>;
  const gid = `mark-${glyph}`;
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} role="presentation" focusable="false">
      <defs>
        <linearGradient id={`${gid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2f2f2" />
          <stop offset="55%" stopColor="#dde5b8" />
          <stop offset="100%" stopColor="#c6e71a" />
        </linearGradient>
      </defs>
      {(shape.evenOdd && shape.fills
        ? [shape.fills.join(" ")]
        : shape.fills
      )?.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={`url(#${gid}-g)`}
          fillRule={shape.evenOdd ? "evenodd" : "nonzero"}
        />
      ))}
      {shape.strokes?.map((s, i) => (
        <path
          key={`s${i}`}
          d={s.d}
          fill="none"
          stroke={`url(#${gid}-g)`}
          strokeWidth={s.w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
