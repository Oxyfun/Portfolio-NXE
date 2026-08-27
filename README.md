# Portfolio NXE

Portfolio personnel de Nolan, dont l'interface reproduit le dashboard
**New Xbox Experience** de la Xbox 360 (2008–2010).

Vite + React + TypeScript · three.js pour l'écran d'accueil · build statique, aucun backend.

- `SPEC.md` — l'analyse des captures de `reference/` et les décisions qui en découlent.
- `CREDITS.md` — tout ce qui vient d'ailleurs, et sous quelle licence.

---

## Lancer

```bash
npm install
npm run dev          # http://localhost:5173
```

Autres scripts :

| commande | effet |
|---|---|
| `npm run build` | build statique dans `dist/` |
| `npm run preview` | sert le build sur <http://localhost:4173> |
| `npm run compare` | boucle de fidélité : capture, compare aux références, écrit dans `shots/` |
| `node measure.mjs` | relève la géométrie du DOM et la confronte aux cotes de `reference/image4.png` |
| `node audit.mjs` | plancher de qualité : erreurs console, temps de chargement, focus, reduced-motion, captures responsive |
| `node pose.mjs "x,y,roll,scale" …` | planche de poses pour régler la console 3D de l'écran d'accueil |
| `node test-flow.mjs` | test fonctionnel : accueil → glissé → clic sur la console → navigation → lame → retour |

`compare.mjs`, `measure.mjs` et `audit.mjs` démarrent le serveur eux-mêmes s'il ne tourne pas déjà.

---

## Naviguer

| | |
|---|---|
| **← →** | tuile précédente / suivante |
| **↑ ↓** | section précédente / suivante (et lignes du panneau quand il est ouvert) |
| **Entrée** | ouvrir la tuile / valider la ligne |
| **Échap**, **Retour arrière** | revenir |
| **Molette** | tuile précédente / suivante (le survol ne sélectionne plus) |
| Souris | clic sur une tuile pour la sélectionner, clic sur la tuile sélectionnée pour l'ouvrir |
| **Tab** | parcourt tuiles, boutons de légende et entrées de la lame |
| **Espace** | comme Entrée |
| Manette | stick gauche et croix directionnelle, **A** valider, **B** revenir (API Gamepad) |

### Écran d'accueil

| | |
|---|---|
| Maintenir **clic gauche ou droit** + bouger | tourne autour de la console, dans le sens du geste |
| Relâcher | la rotation lente automatique reprend |
| **Clic sur la console** | démarre (le curseur passe à `pointer` quand on la survole) |
| **Entrée** ou **Espace** | démarre au clavier |

Au clic, la console pivote toujours vers sa face avant — celle du bouton power — quelle que
soit l'orientation où tu l'as laissée, en zoomant dessus, puis tout s'efface dans le blanc.

Le texte « Cliquer sur la console pour continuer » est une indication : il n'est
pas cliquable. Seule la console l'est — le clic est validé par un raycast sur le
modèle, pas par une zone rectangulaire.

Le son est coupé tant que tu n'as pas interagi avec la page : c'est la politique
autoplay des navigateurs, pas un réglage.

Trois paramètres d'URL, utiles pour le développement :

- `?boot=0` — saute l'écran d'accueil ;
- `?spin=0` — fige la rotation de la console 3D ;
- `?pose=x,y,roll,scale` — impose une pose à la console 3D.

---

## Éditer le contenu

**Tout le texte du site est dans [`src/data/content.ts`](src/data/content.ts).**
C'est le seul fichier à toucher pour changer le contenu.

```ts
export const profile = { gamertag: 'nolan', score: '2026', avatar: '/assets/avatar.png' }
export const siteName = 'Portfolio de Nolan'

export const sections: Section[] = [
  {
    id: 'projets',
    label: 'Projets',            // ← le titre affiché en gros dans l'en-tête
    tiles: [
      {
        id: 'ia-music',
        title: 'Musique IA 24/7',        // ← titre en bas de tuile
        subtitle: 'Lives YouTube en continu',
        glyph: 'music',                   // ← voir la liste ci-dessous
        // image: '/assets/projets/ia.jpg',  ← facultatif : remplace le fond vert
        detail: {
          heading: 'MUSIQUE IA 24/7',     // ← bandeau orange (défaut : le titre en majuscules)
          stats: [{ label: 'Type', value: 'Projet perso' }],
          body: ['Un paragraphe.', 'Un autre.'],
          rows: [{ label: 'Voir la chaîne', href: 'https://…' }],
        },
      },
    ],
  },
]
```

- Une entrée de `rows` sans `href` est un simple élément de menu ; avec `href`,
  elle devient un lien (nouvel onglet pour les URL externes).
- Les liens de la section **Contact** sont des placeholders (`REMPLACER@example.com`,
  `linkedin.com/in/REMPLACER`, `github.com/REMPLACER`) : remplace-les.

### Glyphes disponibles

Icônes NXE d'origine (PNG) : `musiclib`, `picturelib`, `videolib`, `gamelib`,
`settings`, plus les alias `music` et `film`.

Glyphes dessinés en SVG dans le même langage : `home`, `cloud`, `terminal`,
`school`, `mail`, `server`, `search`, `keyboard`.

Pour en ajouter un, deux options :

1. déposer `public/assets/icons/<id>.png` — il l'emporte automatiquement ;
2. ajouter une entrée dans `SHAPES` de [`src/lib/glyphs.tsx`](src/lib/glyphs.tsx).
   Les chemins se dessinent dans une boîte de 120 × 120 ; le dégradé
   blanc → vert-jaune, le reflet et l'ombre sont appliqués automatiquement.

---

## Assets

### Ce qui est déjà là

`public/nxe/`, `public/fonts/` et `public/audio/` contiennent les assets NXE
d'origine (fond, texture de tuile, icônes, pastilles A/B, police Convection,
sons du dashboard). Voir `CREDITS.md` — **lis-le avant de déployer ce site sous
un nom commercial.**

`public/xbox360.glb` est le modèle 3D de la console pour l'écran d'accueil.

### Ce que tu peux déposer toi-même

Tout est optionnel. Si le fichier existe, il l'emporte ; sinon on retombe sur
l'asset NXE, et à défaut sur une version générée en CSS. Rien ne casse si le
dossier est vide.

| chemin | usage |
|---|---|
| `public/assets/background.jpg` (ou `.png`) | le ciel (1920 × 1080 conseillé) |
| `public/assets/floor.png` | le sol, avec transparence au-dessus de l'horizon |
| `public/assets/tile.png` (ou `.jpg`) | la texture de tuile (format 420 × 320) |
| `public/assets/icons/<glyphId>.png` | remplace un glyphe (~207 × 288, glyphe dans les 58 % du haut, reflet en dessous) |
| `public/assets/avatar.png` | la vignette de profil (carrée) |
| `public/assets/sfx/move.wav` | son de déplacement entre tuiles |
| `public/assets/sfx/select.wav` | son de validation |
| `public/assets/sfx/back.wav` | son de retour |
| `public/xbox360.glb` | le modèle 3D de l'écran d'accueil |
| `public/avatar.glb` | l'avatar 3D devant les tuiles (ou `public/assets/avatar.glb`) |

Si `public/xbox360.glb` est absent, l'écran d'accueil construit une
approximation de la console en géométrie procédurale — moins jolie, mais le site
démarre.

### L'avatar 3D

`public/avatar.glb` est affiché devant la rangée de tuiles, animé en boucle. Le composant
choisit tout seul l'animation d'attente parmi celles du fichier (il cherche `breathe`,
`idle` ou `stand` dans les noms, sinon prend la plus longue — marcher et courir sont courts).

**Il appartient à la rangée.** Il se tient au bord droit de la **deuxième** tuile et suit
sa profondeur : quand tu sélectionnes cette tuile il avance et grandit avec elle, et quand
tu passes à la suivante il sort de l'écran avec elle. Quand une lame est ouverte, il se
déplace à droite, devant le panneau. Tout est calé sur les captures de référence (SPEC
§ 8 quater).

**On peut le faire tourner** : maintiens le clic sur lui et glisse de gauche à droite, il
pivote sur 360° et repart en roue libre quand tu lâches. Un tour complet fait 320 px de
glissement. Il tourne uniquement sur lui-même, les pieds restent au sol. Le curseur passe
à « main » quand tu es dessus — et seulement quand tu es vraiment sur la silhouette : il
ne mange jamais un clic destiné à la tuile qu'il recouvre. Relâcher ne resélectionne rien ;
il faut bouger la souris pour ça.

**Chargement différé** : le fichier n'est sondé qu'après le premier rendu, et three.js
n'est importé que si le modèle existe. Le dashboard s'affiche sans lui, puis l'avatar
apparaît en fondu. Supprime le fichier et il n'y a simplement pas d'avatar — rien ne casse,
et three.js n'est pas chargé du tout.

Pour en mettre un autre, passe-le d'abord par l'optimiseur :

```
node tools-optimise-glb.mjs mon-avatar.glb public/avatar.glb 1024 92
```

Il réencode la texture et reconstruit le GLB. Les modèles sortis d'IA arrivent souvent
avec une texture 2048² de plusieurs mégaoctets qui représente 80 % du poids du fichier.

### Effet vieille télé

Trois calques par-dessus tout : un flou léger (`backdrop-filter`), les rayures colorées
(`public/nxe/CRT_Scanlines_Colored.png`) et le cadre à coins arrondis
(`public/nxe/CRT_FrameOnly.png`). Réglable depuis `src/styles/crt.css` :

```css
:root {
  --crt-blur: 0.5px;            /* 0 pour une image nette */
  --crt-scanline-opacity: 0.2;  /* 0 pour supprimer les rayures */
}
```

L'écran d'accueil ne reçoit que le flou. Le cadre s'efface en plein écran.

**Attention à `floor.png`** : l'horizon du sol d'origine est *courbe* (c'est
mesurable sur les références, cf. `SPEC.md` § 1.1). Un sol au bord droit
supprimera cette courbure.

---

## Déployer derrière nginx

```bash
npm run build
# puis copier dist/ sur le VPS
```

Le site est servi depuis la racine du domaine (`base: '/'` dans `vite.config.ts`).
Pour un sous-répertoire, change `base` et les chemins absolus `/nxe/…`, `/audio/…`
dans `src/lib/assets.ts` et `src/hooks/useSounds.ts`.

```nginx
server {
    listen 443 ssl http2;
    server_name exemple.fr;
    root /var/www/portfolio;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Les assets hashés par Vite sont immuables.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Les assets NXE ne sont pas hashés : cache plus court.
    location ~ ^/(nxe|fonts|audio)/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
```

---

## La boucle de fidélité

`compare.mjs` ouvre le site, capture cinq vues, et pour chacune écrit dans `shots/` :

- `iter-NN-<vue>.png` — la capture brute,
- `iter-NN-<vue>-side.png` — la référence et la capture côte à côte,
- `iter-NN-<vue>-diff.png` — la différence absolue amplifiée ×3,
- et un score dans `shots/report.json`, avec l'écart par rapport à l'itération précédente.

Le script échoue si une erreur console apparaît.

Les captures de `reference/` sont en ratio ~1.90, pas en 16:9. Chaque vue est
donc capturée au ratio de sa propre référence pour que la comparaison au pixel
ait un sens ; la vue `fullhd` (1920 × 1080) sert de contrôle de non-régression
au format demandé.

Le score brut n'est pas une note : les références montrent le contenu d'un autre
portfolio (des photos de projets là où ce site a des tuiles vertes unies). Ce qui
compte, ce sont les captures côte à côte et la grille de blocs, qui situent
*où* est l'écart.

---

## Structure

```
src/
  data/content.ts        ← tout le contenu du site
  lib/assets.ts          résolution des assets avec repli en cascade
  lib/glyphs.tsx         glyphes SVG + traitement NXE (dégradé, reflet, ombre)
  hooks/useSounds.ts     sons, avec le décalage de 38–45 ms après l'animation
  hooks/useGamepad.ts    API Gamepad
  components/
    Chrome.tsx           fond, en-tête, bloc profil, pied de page, orbe Guide
    TileRow.tsx          la rangée de tuiles en fuite
    DetailBlade.tsx      le panneau de détail
    BootScreen.tsx       l'écran d'accueil three.js
  styles/
    base.css             police, variables de scène (toutes les cotes relevées)
    dashboard.css        fond, en-tête, tuiles, pied de page
    blade.css            panneau de détail
    boot.css             écran d'accueil
    mobile.css           bascule vers l'idiome « lame »
```

Les valeurs numériques des CSS ne sont pas choisies à l'œil : elles viennent des
mesures consignées dans `SPEC.md`. Si tu en changes une, la ligne de commentaire
au-dessus dit d'où elle vient.
