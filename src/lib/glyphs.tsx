/**
 * Glyphes de tuiles.
 *
 * Les cinq icônes NXE d'origine sont servies telles quelles (PNG). Pour les
 * sections qui n'ont pas d'équivalent, on dessine des formes SVG dans le même
 * langage - épaisses, coins très arrondis - auxquelles on applique le même
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
 * à la même proportion : glyphe dans la bande 7 %-65 % de la hauteur, reflet en
 * dessous. Sans ça, un glyphe SVG et une icône d'origine ne font pas la même
 * taille sur la tuile - c'était visible au premier coup d'œil.
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
  /** Terminal. La barre de titre pleine largeur le faisait lire comme une CARTE
      BANCAIRE - bande = piste magnétique, chevron = puce, tiret = numéro
      gravé. Vérifié au rendu, c'était sans appel. Trois pastilles à la place de
      la bande : c'est le signe « fenêtre » le plus court, et il ne ressemble à
      rien d'autre. Invite et curseur agrandis et posés sur la même ligne de
      base, pour qu'on lise une ligne de commande. Tout est DÉCOUPÉ, puisque
      tout partage le même dégradé. */
  terminal: {
    evenOdd: true,
    fills: [
      "M12 20h96a10 10 0 0 1 10 10v60a10 10 0 0 1-10 10H12A10 10 0 0 1 2 90V30a10 10 0 0 1 10-10Z",
      "M19 30a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      "M36 30a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      "M53 30a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      /* Invite et curseur sur UNE MÊME ligne de base, juste sous les pastilles.
         Posés en bas de la fenêtre, ils laissaient un grand vide au milieu et le
         chevron se lisait comme un éclair. Là, on lit « > _ ». */
      "M23 53l20 14.5-20 14.5-8-6.5 11-8-11-8Z",
      "M52 62h48v11H52Z",
    ],
  },
  /* ── Replis des glyphes qui n'existaient qu'en PNG ────────────────────── */

  /** Appareil photo - repli de `picturelib`. L'objectif est un anneau découpé
      avec sa pastille au centre : trois sous-chemins imbriqués, evenodd fait
      alterner plein / trou / plein. */
  camera: {
    evenOdd: true,
    fills: [
      "M14 36h18l7-9h30l7 9h20a10 10 0 0 1 10 10v42a10 10 0 0 1-10 10H14a10 10 0 0 1-10-10V46a10 10 0 0 1 10-10Z",
      "M60 46a22 22 0 1 1 0 44 22 22 0 0 1 0-44Z",
      "M60 57a11 11 0 1 1 0 22 11 11 0 0 1 0-22Z",
    ],
  },
  /** Manette - repli de `gamelib`. Corps en capsule : une silhouette de manette
      dessinée à la main s'était déjà cassée deux fois (la boule du stick se
      détachait). Croix et boutons DÉCOUPÉS. */
  manette: {
    evenOdd: true,
    fills: [
      "M32 42h56a28 28 0 0 1 0 56H32a28 28 0 0 1 0-56Z",
      "M40 62h9v-9h10v9h9v10h-9v9H49v-9h-9Z",
      "M83 58a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z",
      "M97 74a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z",
    ],
  },
  /** Trois curseurs - repli de `settings`. Les molettes restent DANS la piste :
      débordantes, la partie hors piste se remplirait au lieu de se percer. */
  curseurs: {
    evenOdd: true,
    fills: [
      "M16 32h88a8 8 0 0 1 0 16H16a8 8 0 0 1 0-16Z",
      "M16 56h88a8 8 0 0 1 0 16H16a8 8 0 0 1 0-16Z",
      "M16 80h88a8 8 0 0 1 0 16H16a8 8 0 0 1 0-16Z",
      "M78 34a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
      "M38 58a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
      "M64 82a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
    ],
  },
  /** Pellicule - repli de `film`. Les perforations font tout le travail. */
  pellicule: {
    evenOdd: true,
    fills: [
      "M8 28h104a6 6 0 0 1 6 6v52a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6Z",
      "M13 38h13v11H13Z",
      "M13 55h13v11H13Z",
      "M13 72h13v11H13Z",
      "M94 38h13v11H94Z",
      "M94 55h13v11H94Z",
      "M94 72h13v11H94Z",
      "M34 40h52v40H34Z",
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
  /* ── Glyphes ajoutés pour lever les répétitions ────────────────────────
     Le Parcours affichait trois fois le chapeau d'étudiant et les Projets deux
     fois la manette : les cartes ne se distinguaient plus. Dessinés dans le
     même langage - formes épaisses, coins très arrondis, détails intérieurs
     DÉCOUPÉS et non peints, puisque tout partage le même dégradé. */

  /** Trois nœuds reliés - multi-sites, VLAN, VPN. */
  network: {
    fills: [
      "M42 28a18 18 0 1 1 36 0 18 18 0 1 1-36 0Z",
      "M8 92a18 18 0 1 1 36 0 18 18 0 1 1-36 0Z",
      "M76 92a18 18 0 1 1 36 0 18 18 0 1 1-36 0Z",
    ],
    strokes: [
      { d: "M60 28 L26 92 M60 28 L94 92 M26 92 H94", w: 13 },
    ],
  },

  /** Cœur - la vie d'un rogue-like, et un clin d'œil à Isaac.
      Deux tentatives de manche d'arcade ont échoué : à cette taille la boule se
      détachait du socle et le manche ne reliait rien. Une forme d'un seul
      tenant, elle, se lit sans effort. */
  heart: {
    fills: [
      "M60 106C24 82 12 63 12 45c0-14 11-25 24-25 10 0 19 6 24 14 5-8 14-14 24-14 13 0 24 11 24 25 0 18-12 37-48 61Z",
    ],
  },

  /** Livre ouvert - le lycée, distinct du chapeau de l'école supérieure. */
  book: {
    fills: [
      "M8 30c16-9 34-9 48 0v62c-14-9-32-9-48 0Z",
      "M112 30c-16-9-34-9-48 0v62c14-9 32-9 48 0Z",
    ],
  },

  /** Cible - un objectif visé, pas encore atteint. */
  target: {
    fills: ["M48 60a12 12 0 1 1 24 0 12 12 0 1 1-24 0Z"],
    strokes: [
      { d: "M60 16a44 44 0 1 1-0.1 0Z", w: 12 },
      { d: "M60 34a26 26 0 1 1-0.1 0Z", w: 12 },
    ],
  },

  /** Calendrier - des emplois saisonniers, « étés 2023 et 2024 ».
      Quatre formes ont échoué avant celle-ci (caisse ×3, clé plate) : la caisse
      parce qu'elle n'est que du détail interne, or ici l'interne est du vide ;
      la clé parce que son ouverture la faisait lire comme un « f ». Ce qui
      marche : une masse pleine et des découpes PETITES. */
  calendar: {
    evenOdd: true,
    fills: [
      "M14 26h92a10 10 0 0 1 10 10v56a10 10 0 0 1-10 10H14a10 10 0 0 1-10-10V36a10 10 0 0 1 10-10Z",
      "M4 50h112v7H4Z",
      "M26 66h15v13H26Zm27 0h15v13H53Zm27 0h15v13H80Z",
      "M26 84h15v10H26Zm27 0h15v10H53Z",
    ],
    strokes: [
      { d: "M36 16 V30 M84 16 V30", w: 13 },
    ],
  },

  /** Combiné téléphonique. */
  phone: {
    fills: [
      "M30 8c9 0 16 4 16 11 0 6-5 10-5 16 0 12 14 26 26 26 6 0 10-5 16-5 7 0 11 7 11 16 0 10-8 16-19 16C46 88 32 74 32 74 20 62 8 44 8 27 8 16 18 8 30 8Z",
    ],
  },

  /** Carte de visite avec sa vignette - un profil. */
  badge: {
    evenOdd: true,
    fills: [
      "M12 22h96a10 10 0 0 1 10 10v56a10 10 0 0 1-10 10H12A10 10 0 0 1 2 88V32a10 10 0 0 1 10-10Z",
      "M28 38a11 11 0 1 1 22 0 11 11 0 1 1-22 0Z",
      "M22 76c0-9 8-15 17-15s17 6 17 15Z",
      "M68 44h34v9H68Zm0 20h34v9H68Z",
    ],
  },

  /** Feuille au coin corné - un document, le CV. */
  document: {
    evenOdd: true,
    fills: [
      "M22 8h44l32 32v64a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V18A10 10 0 0 1 22 8Z",
      "M66 8v26a6 6 0 0 0 6 6h26Z",
      "M30 62h50v9H30Zm0 20h50v9H30Z",
    ],
  },

  /** Immeuble de bureaux - un siège social. */
  building: {
    evenOdd: true,
    fills: [
      "M22 14h50a8 8 0 0 1 8 8v30h26a8 8 0 0 1 8 8v52H14V22a8 8 0 0 1 8-8Z",
      "M28 30h11v13H28Zm21 0h11v13H49ZM28 54h11v13H28Zm21 0h11v13H49ZM28 78h11v13H28Zm21 0h11v13H49Zm39-12h13v13H88Zm0 24h13v13H88Z",
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

/* Repli SVG des quatre glyphes qui n'existaient QUE sous forme de PNG NXE.
   Sans eux, `SHAPES[id] ?? SHAPES.home` renvoyait la maison : les dossiers
   d'assets vidés - cas que le projet doit tenir - donnaient quatre tuiles
   « maison » identiques sur Ce portfolio, Orchestrateur, Automatisation & IA et
   Random Letterboxd. Le PNG reste prioritaire quand il est là. */
const REPLIS: Record<string, string> = {
  picturelib: "camera",
  gamelib: "manette",
  settings: "curseurs",
  film: "pellicule",
};

function GlyphSvg({ id }: { id: string }) {
  const shape = SHAPES[id] ?? SHAPES[REPLIS[id]] ?? SHAPES.home;
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

  if (src === undefined) return null; // sonde en cours - évite un flash de SVG
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

  /* Même repli que les tuiles : sans lui la vignette retombait sur un « ▣ »,
     qui n'est ni un glyphe NXE ni rien de reconnaissable. */
  const shape = SHAPES[glyph] ?? SHAPES[REPLIS[glyph]];
  if (!shape) return null;
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
