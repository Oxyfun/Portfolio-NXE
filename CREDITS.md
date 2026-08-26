# CREDITS

Ce projet est une **reconstitution non officielle** du dashboard New Xbox
Experience de la Xbox 360, à usage de portfolio personnel. Il n'est ni affilié à
Microsoft, ni approuvé par Microsoft.

---

## 1. Assets Microsoft (les plus importants du projet)

Ces fichiers sont **les assets d'origine du firmware Xbox 360**, récupérés depuis
<https://gabrielcabrera.co/> (un portfolio Next.js qui les sert publiquement) et
non redessinés.

| fichier(s) | rôle |
|---|---|
| `public/nxe/bg.png` | le ciel du dashboard, 1920 × 1080 |
| `public/nxe/bgFloor.png` | le sol, horizon courbe compris |
| `public/nxe/cards/BlankGreen.jpg` | la texture de tuile verte, 420 × 320 |
| `public/nxe/cards/PanelShadow.png` | l'ombre des panneaux |
| `public/nxe/icons/icon_{musiclib,picturelib,videolib,gamelib,settings}.png` | les glyphes de tuiles, reflet et ombre inclus |
| `public/nxe/BackgroundPanel.png` | le dégradé de fond des lames |
| `public/nxe/Legend_A.png`, `Legend_B.png` | les pastilles A et B |
| `public/nxe/Legend_Menu.png`, `SphereHighlight.png`, `Legend_Highlight.png` | l'orbe Guide et ses variantes |
| `public/nxe/GScore.png`, `redstar.png`, `3qredstar.png` | l'icône Gamerscore, les étoiles de réputation |
| `public/nxe/AvatarShadow.png` | l'ombre d'avatar |
| `public/fonts/Convection.ttf` | **Convection**, la police du dashboard 360 |
| `public/audio/*.wav` (12 fichiers) | les sons du dashboard : déplacement, validation, retour, dépliage, transitions, démarrage |
| `public/xbox360.glb` | modèle 3D de la Xbox 360 Slim, utilisé par l'écran d'accueil |

### Ce qu'il faut savoir

Le brief de départ indiquait que ces assets étaient libres de droit. **Ils ne le
sont pas.**

- **Convection** est une police propriétaire conçue pour Microsoft, distribuée
  commercialement (Monotype / MyFonts, et via le Microsoft Store). Le fichier
  `.ttf` servi par un site tiers ne change rien à son statut.
- Les images et les sons proviennent du firmware de la console. Ils sont couverts
  par le droit d'auteur de Microsoft.
- Le modèle `.glb` de la console est également repris tel quel.

Pour un portfolio personnel, non commercial, sans revente ni redistribution
présentée comme officielle, le risque pratique est très faible et c'est un usage
extrêmement répandu dans les projets de ce type. Mais ce n'est pas « libre de
droit », et il valait mieux l'écrire que le passer sous silence.

**Le site fonctionne sans eux.** Chaque asset a un repli généré en code :
supprime `public/nxe/`, `public/fonts/` et `public/audio/` et le dashboard
s'affiche toujours, avec les dégradés reconstitués à partir des couleurs relevées
sur les captures de `reference/` (voir `SPEC.md`) et des glyphes SVG maison. La
police retombe alors sur la pile `Exo 2 → Titillium Web → Segoe UI → system-ui`.

Si ce site part un jour sous un nom commercial : supprime ces trois dossiers,
dépose tes propres assets dans `public/assets/` (voir README § Assets), et
remplace Convection par une police libre.

---

## 1 bis. Habillage « vieille télé »

| fichier | rôle |
|---|---|
| `public/nxe/CRT_Scanlines_Colored.png` | les rayures colorées |
| `public/nxe/CRT_FrameOnly.png` | le cadre à coins arrondis et sa vignette |

Récupérés au même endroit, mais **ce ne sont pas des assets Microsoft** : ce sont des
textures d'habillage ajoutées par le site de référence, de provenance inconnue. Elles se
régénèrent facilement si tu veux t'en passer — le motif fait trois lignes de haut (cyan
`#00ffc0`, rouge `#f30032`, noir) et le cadre est un rectangle à coins arrondis avec vignette.
Les deux chemins sont dans `src/styles/crt.css`, et l'effet se désactive en mettant
`--crt-blur: 0` et `--crt-scanline-opacity: 0`.

---

## 2. Captures de référence

`reference/image1.png` … `image5.png` sont des captures de
<https://gabrielcabrera.co/> fournies par le commanditaire du projet. Elles ne
servent qu'à la mesure et à la comparaison (`compare.mjs`) et ne sont pas
publiées avec le site — pense à exclure `reference/` de ton déploiement.

Le portfolio de Gabriel Cabrera a servi de référence visuelle et de source pour
les assets Microsoft listés ci-dessus. **Aucun de son code n'a été repris** : le
site d'origine est en Next.js, celui-ci en Vite + React, et toute la mise en page
est dérivée des mesures faites sur les captures, pas de son CSS.

---

## 2 bis. Avatar 3D

`public/avatar.glb` est généré avec [Meshy](https://www.meshy.ai/) à partir d'un rendu de
style avatar Xbox 360, puis riggé et animé par leur outil.

⚠️ **Il a été généré sous licence CC BY 4.0**, l'option « Privé » étant réservée aux
formules payantes. Le modèle est donc publié et réutilisable par des tiers avec
attribution. C'est un avatar cartoon stylisé, pas un scan photoréaliste — le niveau de
sensibilité n'a rien à voir — mais c'est à savoir.

Les fichiers d'origine sont dans `assets-source/`, hors du build.

---

## 3. Recréations open source — licences vérifiées

Le brief demandait de vérifier quatre dépôts. Contrôle fait via l'API GitHub :

| dépôt | licence déclarée | verdict |
|---|---|---|
| [`jeffscottward/xbox-360-dash`](https://github.com/jeffscottward/xbox-360-dash) | **aucune** | non réutilisable |
| [`mochamap1e/x360`](https://github.com/mochamap1e/x360) | **aucune** | non réutilisable |
| [`riquenunes/pegasus-theme-npe`](https://github.com/riquenunes/pegasus-theme-npe) | **aucune** | non réutilisable |
| [`ZivvoZ/dashx360`](https://github.com/ZivvoZ/dashx360) | **aucune** | non réutilisable |

Sans licence explicite, le droit d'auteur par défaut s'applique : « public sur
GitHub » ne veut pas dire « réutilisable ». **Rien n'a été repris de ces quatre
dépôts**, ni code ni assets. Le seul intérêt qu'ils auraient présenté — les
textures NXE — est de toute façon couvert par la section 1, et à une source plus
directe.

*(Note : les trois dernières lignes ont été relevées alors que l'API GitHub était
en limite de débit pour les métadonnées complètes ; l'absence de fichier de
licence a été confirmée pour le premier dépôt et présumée pour les trois autres.
Comme rien n'en est repris, la question reste théorique.)*

---

## 4. Dépendances

| paquet | licence |
|---|---|
| [React](https://react.dev/) | MIT |
| [Vite](https://vite.dev/) | MIT |
| [three.js](https://threejs.org/) | MIT |
| [TypeScript](https://www.typescriptlang.org/) | Apache-2.0 |
| [Playwright](https://playwright.dev/) | Apache-2.0 |
| [pngjs](https://github.com/pngjs/pngjs) | MIT |

Aucune bibliothèque d'animation : tout est en CSS. `motion` avait été installé au
départ puis retiré — le navigateur gère nativement ces transitions, un runtime de plus
n'apportait rien.

---

## 5. Ce qui a été écrit pour ce projet

Tout le reste : la mise en page et ses cotes (dérivées des mesures de `SPEC.md`),
les composants React, les glyphes SVG `home` / `cloud` / `terminal` / `school` /
`mail` / `server` / `search` / `keyboard`, l'écran d'accueil three.js, l'outillage
`compare.mjs` / `measure.mjs` / `audit.mjs` / `pose.mjs` / `test-flow.mjs`, le montage de
l'effet vieille télé, et les textes du site.
