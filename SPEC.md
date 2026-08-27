# SPEC — Portfolio NXE (New Xbox Experience, 2008–2010)

Analyse des captures de `reference/` et décisions d'implémentation.
Toutes les mesures ci-dessous sont relevées au pixel sur les captures, pas estimées à l'œil.

---

## 0. Ce que sont les références

| Fichier | Contenu | Résolution | Ratio |
|---|---|---|---|
| `image1.png` | Écran d'accueil : Xbox 360 Slim 3D sur fond blanc, « Click to continue » | 2521×1326 | 1.901 |
| `image2.png` | Dashboard, section *Testimonials*, tuile 2/5 sélectionnée, avatar 3D visible | 2530×1330 | 1.902 |
| `image3.png` | Panneau de détail « lame » (profil + succès) | 2506×1300 | 1.928 |
| `image4.png` | Dashboard, section *Projects*, tuile 1/4 — **la plus propre, référence principale** | 2526×1368 (barre navigateur 34 px en haut → 2526×1334 utiles) | 1.893 |
| `image5.png` | Panneau de détail « lame » (projet HARDLAUN.CH) | 2548×1330 | 1.916 |

Les cinq captures viennent de <https://gabrielcabrera.co/>, un portfolio Next.js qui réutilise
**les assets originaux de Microsoft**. Point capital pour la fidélité : ce site sert
`/bg.png` et `/bgFloor.png`, qui sont *le fond NXE d'origine*, pas une reconstitution.
Idem pour la police (`/fonts/Convection.ttf`), les glyphes de tuiles, les pastilles A/B et
les sons du dashboard. Voir §9 et `CREDITS.md`.

⚠️ **Note d'honnêteté sur les droits.** Le brief dit que ces assets sont libres de droit.
Ils ne le sont pas : `Convection` est une police propriétaire Microsoft/Monotype, et les
sons + textures viennent du firmware Xbox 360. Pour un portfolio personnel non commercial
le risque pratique est proche de zéro et je les utilise comme demandé — mais ils sont
isolés dans `public/nxe/`, `public/fonts/` et `public/audio/`, chaque fichier est listé dans
`CREDITS.md`, et le site **fonctionne sans eux** (fallbacks générés en code, §9.3).
Si tu déploies un jour ce site sous un nom commercial, supprime ces trois dossiers.

**Ratio des captures ≈ 1.90, pas 16:9.** Conséquence méthodologique : toute mesure exprimée
en « % de la largeur » n'est pas transposable. Je décris donc la scène en **unités de hauteur**
(`vh`), ce qui est correct physiquement — une projection perspective se dimensionne sur le
champ de vision vertical. `compare.mjs` capture à la fois en 1920×1080 (demandé) et à
2526×1334 (ratio natif des références) pour que la comparaison au pixel ait un sens.

---

### Les captures ajoutées le 26/08

`image6` à `image11` sont venues après coup et ont tranché plusieurs points
restés ouverts. Elles montrent le site de référence AVEC son effet CRT : toute
lecture de couleur dessus doit moyenner sur deux périodes de rayure (~8 lignes),
sinon on relève l'alternance des rayures et pas la couleur.

| capture | ce qu'elle apporte |
|---|---|
| image6 | dashboard complet, « 1 of 5 » — avatar au bord droit de la tuile 1 |
| image7 | le bandeau de notification (non implémenté, cf. § 12) |
| image8 | lame ouverte AVEC image de bandeau, panneau arrière dimensionné sur son contenu |
| image9 | lecteur audio centré (non implémenté) + onde sous l'orbe bien visible |
| image10 | lame ouverte SANS image, avatar visible à droite, filets entre les entrées |
| image11 | gros plan sur l'onde du logo Xbox |

---

## 1. Fond

### 1.1 Structure en trois couches

Le fond n'est **pas** un simple dégradé CSS. C'est la superposition de :

1. `bg.png` — 1920×1080, le ciel complet, `background-size: cover`.
2. `bgFloor.png` — 1920×1080 avec alpha, le sol gris. **Sa ligne d'horizon est courbe**,
   pas droite : convexe, sommet vers x ≈ 0.85.
3. Une vignette radiale sombre par-dessus (voir §1.4).

C'est cette courbure du sol qui explique une mesure qui m'a d'abord paru être du bruit :

| x (relatif) | y de l'horizon (relatif à la hauteur) |
|---|---|
| 0.01 | 0.5885 |
| 0.05 | 0.5840 |
| 0.90 | 0.5682 |
| 0.98 | 0.5772 |

L'horizon monte de gauche (0.589) jusqu'à x≈0.90 (0.568) puis redescend légèrement (0.577).
Soit un arc de ~23 px d'amplitude sur 1080 px de haut. Mesures cohérentes sur les trois
captures de dashboard (image2 : 0.5797 → 0.5579 → 0.5669 ; image5 : 0.5917 → 0.5707 → 0.5797).

**Décision :** on utilise les deux PNG originaux. Reproduire cet arc en CSS demanderait un
`border-radius` elliptique + masque, et serait de toute façon approximatif.

### 1.2 Ciel — dégradé relevé (image2, colonne x = 0.02)

| y | couleur |
|---|---|
| 0.00 | `#264102` |
| 0.10 | `#406406` |
| 0.20 | `#5e851d` |
| 0.30 | `#739c4a` |
| 0.40 | `#88ad7a` |
| 0.50 | `#b5cbbe` |
| 0.55 | `#ccdddb` |

Colonne x = 0.97 :

| y | couleur |
|---|---|
| 0.20 | `#637a6b` |
| 0.30 | `#859f7a` |
| 0.40 | `#aec27e` |
| 0.50 | `#d5dc8b` |
| 0.55 | `#e4e28f` |

**Correction au brief :** le brief annonce « vert soutenu en haut à gauche qui s'éclaircit vers
un blanc légèrement cyan à droite ». Les captures disent autre chose :
le vert profond occupe **tout le haut** (`#264102` à gauche, `#3a4b3f` à droite),
et près de l'horizon c'est **la gauche qui vire au blanc cyan** (`#ccdddb`) tandis que
**la droite vire au jaune chaud** (`#e4e28f`). Le dégradé principal est vertical, pas horizontal.
C'est bien ce qu'on voit aussi dans `bg.png` : bande lumineuse blanc-cyan horizontale au
niveau de l'horizon, coin haut-droit sombre et désaturé, tache jaune-orangé en bas à droite.

### 1.3 Sol — dégradé relevé (image2, colonne x = 0.02)

| y | couleur |
|---|---|
| 0.60 | `#545f67` |
| 0.65 | `#46515a` ← bande sombre juste sous l'horizon |
| 0.70 | `#616a74` |
| 0.80 | `#8e96a3` ← maximum de brillance |
| 0.85 | `#919ea9` |
| 0.95 | `#6e7a81` |

Horizontalement à y = 0.75 : `#919ba3` (gauche) → `#525c64` (droite). Le sol est plus clair
à gauche et s'assombrit vers la droite et vers le bas — c'est un reflet spéculaire large.

### 1.4 Cercles concentriques et vignette

Les amas de cercles sont **déjà dans `bg.png`** (visibles en filigrane à ~4–8 % d'opacité,
tailles de 20 à 250 px, mélange de disques flous, d'anneaux fins et de grappes de petits
cercles). Rien à redessiner.

Une vignette est nécessaire par-dessus : à y = 0.05, le ciel passe de `#456509` (x=0.10) à
`#6f9136` (x=0.50) puis `#475245` (x=0.90) — les bords sont nettement plus sombres que le
centre, ce qui ne vient pas de `bg.png` seul.
→ `radial-gradient(ellipse 120% 100% at 50% 45%, transparent 55%, rgba(0,0,0,.38) 100%)`.

### 1.5 « Respirer »

Le fond ne doit pas être figé. Animation retenue : une dérive lente du `background-position`
du ciel (±0.8 %, 38 s, `ease-in-out` alterné) plus une pulsation d'opacité de la vignette
(±0.03, 24 s). Amplitude volontairement sous le seuil de perception consciente.
Désactivé sous `prefers-reduced-motion`.

---

### Le fond bouge

Les grands anneaux translucides du NXE dérivent lentement. Ceux de `bg.png` sont
cuits dans l'image et ne peuvent pas bouger : un calque `.bg-sky::after` en
ajoute six, très pâles (5 % de blanc), qui dérivent de 2.6 vh sur 74 s avec un
léger grossissement. Peu nombreux et discrets — on doit le remarquer sans le
regarder.

La respiration du ciel elle-même est passée de `background-position` à
`transform`. Animer la position d'un fond **repeint** le calque à chaque image ;
sur une image plein écran ça se paie sur le fil principal et retarde les sons.
Amplitude conservée (1.6 % de large).

### L'onde sous l'orbe Xbox (image11)

L'orbe repose sur une eau immobile où tombe une goutte. Quatre anneaux décalés
d'un quart de cycle, période 8.8 s.

| grandeur | relevé |
|---|---|
| centre | bas de la sphère — 49.5 % / 73.1 % de la boîte de l'orbe |
| diamètre max | ~4.5 × le diamètre de la sphère, soit 31 vh |
| rapport | 2:1 (le sol est vu en perspective, les cercles s'y projettent en ellipses) |
| contraste | **+2.5 unités de luminance sur 255** au-dessus du fond |

Deux pièges payés ici. `Legend_Menu.png` a du vide autour du glyphe : la sphère
n'occupe que 46.3 % de la boîte et son bas est à 73.1 % de la hauteur, pas en
bas — placer l'onde à 92 % la décrochait sous la sphère. Et une bordure de
1.5 px est arrondie à 1 px à densité 1, ce qui la faisait disparaître : 2 px.

L'opacité tient un palier (0.16 à 9 %, 0.11 à 55 %) au lieu de décroître dès le
départ. Avec une simple rampe, chaque anneau passait l'essentiel de son cycle à
0.03 et on ne voyait plus rien — mesuré, 24 unités d'écart sur 1243 pixels pour
un résultat invisible à l'œil.

**Écart assumé** : le contraste réel est de 1 %, ce qui serait presque invisible
sur un écran ordinaire. On est à ~6 %. Fidèle à l'intention, plus visible que le
relevé.

---

## 2. Tuiles

### 2.1 Format

`BlankGreen.jpg` (la texture d'origine) fait **420×320**, soit un ratio de **1.3125**.
Mesure sur image4, tuile sélectionnée : 736×559 px → **1.3166**. Les deux concordent.

**Correction au brief :** les tuiles ne sont pas carrées. Elles sont en 4:3 large (1.3125:1).
J'utilise le ratio exact de la texture d'origine.

### 2.2 Géométrie relevée (image4, section *Projects*, 4 tuiles, contenu 2526×1334)

| tuile | gauche (px) | haut (px) | droite (px) | bas (px) | largeur | hauteur |
|---|---|---|---|---|---|---|
| 1 (sélectionnée) | 173 | 493 | 909 | 1052 | 736 | 559 |
| 2 | ~677 | 540 | 1329 | 1001 | ~611 | 461 |
| 3 | ~1252 | 573 | 1759 | 962 | ~507 | 389 |
| 4 | ~1654 | 605 | 2075 | 925 | ~421 | 320 |

Rapports de hauteur successifs : 461/559 = **0.8247**, 389/461 = **0.8438**, 320/389 = **0.8226**.
→ **facteur d'échelle constant k = 0.83** par tuile.

Confirmé indépendamment sur image2 (section *Testimonials*, 5 tuiles) :
hauteurs 559, 461, 388, 320 px → 0.8247, 0.8416, 0.8247. **Identique.**

### 2.3 L'axe de la fuite

Ordonnées des centres, image4 : 0.5791, 0.5776, 0.5755, 0.5736 (en unités de hauteur).
Image2 : 0.5688, 0.5665, 0.5654, 0.5639.

**Les tuiles sont centrées verticalement sur une ligne quasi constante**, très légèrement
remontante vers la droite (−0.005 H sur toute la rangée). Ce n'est donc pas « les tuiles
descendent » : elles rétrécissent autour d'un axe fixe, ce qui fait descendre leur bord
supérieur et remonter leur bord inférieur. L'effet perçu est le bon, le modèle est plus simple.

Cette ligne est à ~0.578 H — soit **l'horizon lui-même** (0.568–0.589). Les tuiles sont
posées sur la ligne d'horizon. C'est la clé de la mise en page.

### 2.4 Pas horizontal

Bords gauches en unités de hauteur : 0.1297, 0.5383, 0.9386, 1.2400.
Écarts : 0.4086, 0.4003, 0.3014 — rapportés à la largeur de la tuile précédente :
0.741, 0.874, 0.793. Moyenne **0.79**.

Modèle retenu : `left(i+1) = left(i) + width(i) × 0.79`.
Erreur résiduelle < 3 % de la largeur d'une tuile — la dispersion vient très probablement
d'une capture prise en cours d'animation de la rangée. À affiner dans la boucle `compare`.

### 2.5 Dégradé et voile sombre

Profil vertical relevé dans la tuile sélectionnée (à 6 % du bord gauche, hors glyphe) comparé
à la texture `BlankGreen.jpg` au même point :

| y (dans la tuile) | capture | texture d'origine | ⇒ alpha noir |
|---|---|---|---|
| 0.00 | `#bbd331` | `#bbd631` | 0.00 |
| 0.50 | `#97c81f` | `#99c91d` | 0.02 |
| 0.55 | `#8bb921` | `#97c71d` | 0.08 |
| 0.60 | `#7fa416` | `#93c518` | 0.13 |
| 0.65 | `#779a11` | `#a0cc15` | 0.26 |
| 0.75 | `#537007` | `#81be09` | 0.36 |
| 0.95 | `#213402` | `#78b802` | 0.73 |

La texture est donc rendue telle quelle sur la moitié haute, et un **voile noir** est appliqué
en dessous pour asseoir le texte :

```css
linear-gradient(to bottom,
  rgba(0,0,0,0)    48%,
  rgba(0,0,0,.13)  60%,
  rgba(0,0,0,.26)  65%,
  rgba(0,0,0,.36)  75%,
  rgba(0,0,0,.78) 100%)
```

Le « reflet brillant sur la moitié supérieure » du brief est déjà dans `BlankGreen.jpg`
(halo blanc-jaune en haut au centre, `#f4f3a1` à y=0.05, qui redescend vers `#a2ca1c` à mi-hauteur).

### 2.6 Rayon des coins

Sonde diagonale sur le coin haut-gauche de la tuile sélectionnée : la transition fond → tuile
s'opère entre d = 5 et d = 8 px sur une tuile de 736 px de large.
→ **rayon ≈ 7 px pour 736 px**, soit 0.95 % de la largeur. À 1920×1080 (tuile ≈ 595 px) : **6 px**.
Confirme « coins légèrement arrondis » : c'est très peu, il ne faut surtout pas mettre 16 px.

### 2.7 Glyphes

Les glyphes NXE d'origine sont récupérés (`icon_musiclib`, `icon_picturelib`, `icon_videolib`,
`icon_gamelib`, `icon_settings`, PNG ~210×280 avec alpha). Ils portent **déjà** dans le fichier :

- le dégradé vertical blanc → vert-jaune (blanc pur en haut, `#c8e820` en bas) ;
- un reflet inversé et fondu sous le glyphe ;
- l'ombre portée douce.

Inclinaison mesurée sur la tuile *Picture Library* d'image2 : **−13°** environ (sens antihoraire),
glyphe centré horizontalement à ~48 % et verticalement à ~40 % de la tuile,
hauteur ≈ 62 % de la hauteur de la tuile.

Pour les sections du portfolio qui n'ont pas d'équivalent NXE (Compétences, Parcours, Contact),
je dessine des glyphes SVG dans le même langage — formes épaisses à coins très arrondis — et
je leur applique **le même traitement** (dégradé blanc→vert, reflet, ombre) via un composant
`<NxeGlyph>` partagé, pour que rien ne détonne à côté des originaux.
Pas d'emoji. Nulle part.

### 2.8 Titre et sous-titre

Relevés sur image4 (tuile de 736×559) :

- Titre : `#ffffff`, corps déduit de la largeur du mot (« TTS.Mom » fait 125 px, donc 33 px
  de corps) — vérifié : 123 px de large contre 125 une fois posé.
- Sous-titre : `#c9d0d4` (blanc légèrement froid, pas gris neutre). Corps déduit de la même
  façon : « Text-to-Speech Platform » fait 226 px, soit 22.9 px de corps.
- **Positions relevées, pas devinées** : le bas d'encre du titre est à 15.2 % de la hauteur de
  tuile, celui du sous-titre à 8.4 %, les deux à 4.8 % du bord gauche. Mon libellé était
  10 px trop bas, ce qui le faisait paraître plus petit alors que le corps était exact.

Piège de mesure rencontré ici : sur image4 la tuile porte une illustration claire, et un seuil
de luminance destiné à isoler le texte blanc attrape aussi le dessin. Les premières largeurs
relevées (195 px au lieu de 125) étaient fausses pour cette raison.

Sur les tuiles non sélectionnées, titre et sous-titre existent mais sont partiellement
masqués par la tuile suivante — pas d'exception à coder, c'est le recouvrement naturel.

### 2.9 Reflet au sol

Visible sous chaque tuile : copie miroir, floutée, désaturée, très pâle. Relevé dans
`c_refl4.png` : le texte inversé reste lisible sur ~0.28 de la hauteur de la tuile avant
extinction, et la zone du reflet est **plus claire** que le sol alentour (`#c5cdd4` contre
`#8e96a3`) — c'est un débord lumineux, pas seulement un miroir.

Implémentation : duplication du nœud, `transform: scaleY(-1)`, `filter: blur(2px) saturate(.35)`,
`opacity: .30`, masque `linear-gradient(to bottom, rgba(0,0,0,.55), transparent 30%)`,
plus un halo `radial-gradient` blanc à 8 % sous la tuile.

---

## 3. En-tête

Bord gauche aligné sur le bord gauche de la tuile sélectionnée (x = 173 px dans image4,
soit la même marge). Trois lignes, mesurées sur image4 (H = 1334) :

| ligne | contenu | haut (px) | hauteur de capitale | corps déduit | en unités H |
|---|---|---|---|---|---|
| 1 | section précédente | 119 | 22 px | ~31 px | 0.0235 H |
| 2 | nom du site | 169 | 32 px | ~46 px | 0.0345 H |
| 3 | section courante | 238 | 41 px | ~59 px | 0.0442 H |

**Correction au brief :** l'ordre n'est pas « nom / section / tuile ». Sur image4 c'est
`Testimonials` (section précédente, petit) / `Gabriel's Portfolio` (nom du site, moyen) /
`Projects` (**section courante**, gros et clair). Sur image2 : `Projects` / `Testimonials` /
`Gabriel's Portfolio`. C'est un **fil d'Ariane qui défile** : les lignes remontent quand on
change de section, la ligne du bas étant toujours celle où l'on se trouve.

J'adopte exactement ce comportement, avec la même animation de remontée (les trois lignes
glissent vers le haut, la nouvelle entre par le bas).

Couleurs : ligne 1 `rgba(255,255,255,.45)`, ligne 2 `rgba(255,255,255,.72)`,
ligne 3 `#ffffff`. Ombre `0 2px 5px rgba(0,0,0,.45)` sur les trois.

### 3.1 Bloc profil (haut droite)

- Pseudo : ~57 px de corps (0.0427 H), `#e8ecee`, aligné à droite.
- Score : « 50 » + icône `GScore.png` (32×32, disque gris clair avec un G), même alignement,
  ~44 px de corps.
- Vignette : carrée, 127×123 px sur H=1334 → **0.095 H**, bord droit à 0.967 W,
  bord blanc de 2 px à 60 % d'opacité, rayon 2 px.

---

## 4. Pied de page

Relevés sur image4 (distances depuis le bas du contenu, H = 1334) :

- « 1 of 4 » : centre à 221 px du bas → **0.166 H**, aligné sur la marge gauche,
  ~34 px de corps, `#d5dbde`.
- Pastille A : diamètre 45 px → **0.034 H**, centre à 110 px du bas → **0.082 H**.
- Libellé « Select » : ~40 px de corps, `#ffffff`, ombre portée marquée.
- Pastille B (visible sur image3/image5) : même diamètre, à ~205 px à droite du libellé A.

Les pastilles sont les PNG d'origine (`Legend_A.png`, `Legend_B.png`, 32×32) : sphères
bombées avec spéculaire haut-gauche, anneau sombre, lettre en creux — un `border-radius`
CSS ne rend pas ça.

Logo Guide Xbox en bas à droite (`Legend_Menu.png`, 108×108) : présent sur toutes les
captures, à ~0.10 H de diamètre, coin bas-droit.

---

## 5. Panneau de détail (« lame »)

D'après image3 et image5.

- Panneau : `#2d3a42` (ardoise bleutée), texture de fines rayures horizontales
  (`BackgroundPanel.png`, 75×75, répétée), rayon 12 px,
  ombre `0 18px 50px rgba(0,0,0,.55)`, liseré haut `rgba(255,255,255,.10)`.
  Occupe x ∈ [0.079, 0.497] W et y ∈ [0.156, 0.850] H.
- Bandeau titre orange : dégradé `#f2b93b` → `#eda01a` → `#e88f0a`, hauteur ~0.06 H,
  texte `#d8dde0` (pas blanc pur), interlettrage +0.5 px.
- Encart d'infos : légèrement plus clair que le panneau, rayon 8 px, vignette carrée à gauche
  avec liseré gris, libellés à gauche / valeurs à droite, étoiles `redstar.png` orange.
- Ligne sélectionnée : dégradé vert brillant relevé au pixel —
  `#c9e1a2` (haut) → `#7db430` (60 %) → `#9fc952` (bas), liseré supérieur clair, rayon 6 px.
- Lignes non sélectionnées : texte `#b9c0c4`, séparateur `rgba(255,255,255,.13)` de 1 px.
- Second panneau à droite, décalé vers le bas et légèrement en retrait (plan arrière).

**Ouverture.** Le brief demande « le style d'ouverture des menus du NXE plutôt qu'un panneau
latéral générique ». Dans le NXE, la lame se **déplie** : elle apparaît écrasée verticalement
au niveau de son bandeau titre, puis se déroule vers le bas en 260 ms
(`scaleY` 0.04 → 1, origine en haut, `cubic-bezier(.16,1,.3,1)`), le contenu apparaissant
en décalé de 90 ms. Le son associé est `snd_panelunfold.wav`. Le second panneau entre 120 ms
après le premier, en glissant de la droite.

---

### 5 quater. La colonne de détail prend la main

Flèche droite ou clic : le panneau de détail s'éclaircit (#2d353d → #414c58),
son texte passe au blanc et il reçoit le focus, ce qui suffit à le faire défiler
aux flèches nativement. Flèche gauche pour rendre la main à la liste.

**Cet état n'est pas dans les références** — elles ne montrent que des poses
figées. Il répond à un vrai problème d'usage : le détail restait sombre, peu
lisible, et rien n'indiquait qu'on pouvait le parcourir.

L'anneau de focus global (vert + halo) formait ici une grosse boîte au milieu
du texte. Comme c'est le panneau entier qui signale qu'il a la main,
un liseré à 22 % suffit.

**La rangée disparaît derrière la lame.** Vérifié sur image8 comme sur image10 :
au bord gauche de l'écran, derrière les panneaux, il n'y a que le fond — aucune
carte.

**Surbrillance et texte changeaient en deux temps.** Seule la couleur du texte
était transitionnée : le vert de sélection apparaissait d'un coup et le texte
blanchissait 120 ms plus tard. Le fond a maintenant la même transition.

### 5 ter. Le voile de la lame volait les clics

Les trois boutons de légende faisaient tous la même chose : ils ne faisaient
rien, et le clic atteignait `.blade-scrim` — le voile plein écran qui ferme la
lame. D'où « Sélectionner » sans effet, et « Ouvrir » comme « Retour » qui
fermaient tous les deux.

Deux causes empilées, il fallait corriger les deux :

1. c'étaient des `<span>`, donc purement décoratifs ;
2. même transformés en `<button>`, le pied de page était en `z-index: 40`
   sous `.blade-layer` (60) : le voile continuait d'intercepter le clic.

Le pied est passé à 80. C'est Playwright qui a désigné le coupable, en
rapportant `<button class="blade-scrim"> intercepts pointer events`.

### 5 bis. Ce qu'image8 et image10 ont corrigé

La lame était le défaut le plus visible du site. Quatre corrections, toutes
relevées :

**Le panneau arrière avait une hauteur fixe.** `height: 54.4vh` + `overflow:
hidden` : le texte se coupait net au milieu d'une phrase, sans aucun moyen de
lire la suite. Sur image8 comme sur image10 le panneau s'arrête juste après son
contenu. Il se dimensionne maintenant dessus (`max-height: 62vh`), et son corps
défile en dernier recours. `min-height: 0` est indispensable sur l'enfant flex,
sinon il refuse de rétrécir sous sa hauteur de contenu et l'`overflow` ne sert à
rien.

**Le corps de texte était 19 % trop gros.** Interligne relevé sur image8 : trois
lignes consécutives à **51 px d'écart exactement, soit 3.78 vh**. Le nôtre en
faisait 4.50 (2.9 × 1.55). Recoupement indépendant : la référence loge ~56
caractères par ligne dans un panneau large de 30 % d'écran, nous 37 dans 33 %.
Corrigé à 2.52 vh / 1.5 — et le texte tient désormais sans défiler.
*Ce qui est mesuré, c'est l'interligne ; la répartition entre corps et interligne
est un choix conventionnel.*

**Le bandeau visuel était rendu même sans image.** D'où une bande noire vide
surmontée d'un titre qui semblait mal placé. image8 a une image et le titre est
posé dessus ; image10 n'en a pas et le panneau commence directement par un
titre. On rend maintenant l'un ou l'autre.

**Les couleurs étaient devinées.** Relevées sur image10 en moyennant huit lignes
pour annuler les rayures CRT :

| élément | avant (au jugé) | relevé |
|---|---|---|
| fond de lame | `#2d3a42` | `#2d353d` |
| panneau arrière | `filter: brightness(.94)` | fond `#282f36` |
| bandeau titre haut → bas | `#f2b93b` → `#e88f0a` | `#e7a215` → `#e8a819` (quasi plat) |
| bouton vert : haut / creux / bas | `#c9e1a2` / `#7db430` / `#9fc952` | `#bad38f` / `#76ad25` / `#8dbd3d` |
| filet entre entrées | 13 % de blanc | `#636a75`, soit 22 % |

Le bandeau titre est presque plat, alors que j'avais mis un dégradé très
contrasté. Et le titre n'est **ni en capitales ni interlettré** : la référence
affiche « mopo1o » et « TTS.Mom » dans leur casse d'origine.

Le `filter: brightness()` du panneau arrière est remplacé par un fond : un
filtre ré-rastérise tout le sous-arbre à chaque image, et la nuance est une
couleur, pas un effet.

---

## 6. Typographie

La police est **Convection** — la police propriétaire Microsoft du dashboard 360
(dérivée de Neo Sans). Le site de référence la sert en TTF ; je la récupère telle quelle.

Pile CSS, avec repli si le fichier est absent :

```css
font-family: 'Convection', 'Exo 2', 'Titillium Web', 'Segoe UI', system-ui, sans-serif;
```

### 6.1 Graisse — j'avais tort

Le fichier Convection récupéré n'a qu'une graisse (400), et j'en avais conclu qu'il ne fallait
jamais demander de gras, le navigateur le synthétisant. **La mesure dit le contraire : le site
de référence rend son interface en gras synthétique.**

Méthode : à hauteur de capitale et à largeur de mot calées sur la référence, on compare la
**densité d'encre** — le nombre de pixels de texte rapporté à la surface du mot. C'est une
mesure de graisse indépendante de la taille, et contrairement à l'épaisseur d'un fût elle ne
dépend pas de la ligne de balayage choisie.

| chaîne d'image4 | cible | poids 400 | poids 600 |
|---|---|---|---|
| « Testimonials » | 0.192 | 0.131 | 0.278 |
| « Gabriel's Portfolio » | 0.336 | 0.248 | **0.346** |
| « Projects » | 0.329 | 0.220 | **0.290** |
| « mopo1o » | 0.284 | 0.233 | **0.302** |

La cible tombe systématiquement du côté du gras. `font-weight: 600` est donc posé sur `body`.

Deux fausses pistes écartées en route, qui valent d'être notées :

- **La couleur.** Mes deux premières lignes de fil d'Ariane étaient des blancs translucides
  (`rgba(255,255,255,.45)` et `.72`) ; le vert du fond passait au travers et les verdissait.
  Mesuré sur les pixels les plus clairs : `#829b5a` chez moi contre `#adbd92` côté référence.
  En inversant la composition sur les canaux R et B, les vraies couleurs sont **opaques** :
  `#cccccc` et `#f5f5f5`.
- **`-webkit-font-smoothing: none`.** Le site de référence le pose sur `html`, et l'hypothèse
  d'un rendu sans anticrénelage était séduisante. Vérification faite, c'est une propriété
  macOS : sans aucun effet sous Windows ou Linux. Elle n'explique rien et n'a pas été gardée.

L'interlettrage recalé par le même ajustement vaut 0.098 em (0.100 / 0.092 / 0.106 selon la
ligne, une valeur commune suffit : l'écart de largeur reste sous 2 %).

---

## 7. Sons

Fichiers d'origine récupérés (48 kHz / 44.1 kHz, PCM 16 bits) :

| événement | fichier | durée |
|---|---|---|
| déplacement à droite | `snd_panelright.wav` | 0.29 s |
| déplacement à gauche | `snd_panelleft.wav` | 0.22 s |
| validation (A) | `snd_buttonselect.wav` | 0.89 s |
| retour (B) | `snd_buttonback.wav` | 0.87 s |
| survol / focus | `btn_Focus.wav` | 0.22 s |
| dépliage de lame | `snd_panelunfold.wav` | 0.56 s |
| changement de section | `snd_channelup.wav` | 0.02 s |
| transition vers le dashboard | `snd_transitioninto.wav` | 2.66 s |
| démarrage console | `intro.wav` | 7.02 s |

**Décalage demandé (30–50 ms après le début de l'animation).** Implémenté avec un délai de
**38 ms** pour les déplacements et **45 ms** pour validation/retour, via `setTimeout` sur la
frame qui lance l'animation. Un même son ne peut jamais se déclencher deux fois dans la même
frame (garde par identifiant). Volume global 0.55, réglable, coupé par défaut tant que
l'utilisateur n'a pas interagi (politique autoplay des navigateurs).

---

### 7 bis. Deux sons qui n'allaient pas

**Le son de démarrage n'était jamais joué.** `intro.wav` (7.02 s — le carillon
Xbox 360 que tout le monde reconnaît) était présent dans `public/audio/` mais le
clic sur la console déclenchait `snd_transitioninto.wav`. C'est maintenant
`intro.wav`, et il déborde volontairement sur le dashboard : c'est ce que fait
la vraie console, le carillon continue pendant que le tableau de bord apparaît.
Le clic étant un geste utilisateur, la lecture automatique est autorisée.

**Le changement de section n'avait en pratique aucun son.**
`snd_channelup.wav` dure **20 ms** — lu dans son en-tête WAV, c'est un fichier
tronqué, inaudible. Remplacé par `btn_Select.wav` (0.53 s).

Durées relevées sur les en-têtes, pour mémoire : `intro` 7.02 s ·
`snd_transitioninto` 2.66 · `snd_buttonselect` 0.89 · `snd_buttonback` 0.87 ·
`snd_panelunfold` 0.56 · `btn_Select` 0.53 · `NotifyPopup` 0.32 ·
`snd_panelright` 0.29 · `btn_Focus` 0.22 · `snd_panelleft` 0.22 ·
`snd_channelup` **0.02**.

---

## 8. Écran d'accueil 3D

`image1.png` : Xbox 360 Slim posée en diagonale (rotation ~−28° dans le plan écran), fond
blanc pur, légende « Click to continue » en bas, centrée, gris `#8a8a8a`.

Le modèle `xbox.glb` du site de référence est récupérable (1.3 Mo) et sera placé en
`public/xbox360.glb`. Si le fichier est absent, un modèle procédural est construit
(boîtier `BoxGeometry` à arêtes biseautées, grille d'aération en instances, disque de bouton
power, plateau de disque), afin que le projet démarre même sans le `.glb`.

**Arrivée.** Le panneau est blanc et opaque dès la première frame ; c'est son *contenu* qui
apparaît en fondu (console sur 1100 ms, indication sur 800 ms après 500 ms de retard).
Faire le fondu sur le panneau lui-même laissait voir le vert du `body` au travers.

**Indication.** « Cliquer pour continuer », non cliquable (`pointer-events: none`), en
respiration lente de 3.2 s entre 28 % et 100 % d'opacité — les consoles de l'époque
respiraient, elles ne clignotaient pas comme un avertissement. Elle s'efface au clic.

**Séquence au clic** — une seule interpolation, pas d'étapes. `fadeStart` (840 ms) vient
**après** la fin de `turn` (880 ms, à 40 ms près) : quand le fondu partait à 620 ms pour une
rotation de 1150 ms, le blanc recouvrait la console avant son arrivée. Invisible depuis le
repos, où le trajet est court ; flagrant après avoir tourné la console à l'opposé.

1. la caméra fait le tour jusqu'en face de la console, **par le chemin le plus court** :
   `nearestAngle` ramène l'azimut cible sur le tour le plus proche, donc l'animation reste
   courte même après vingt tours de glissé.

   La direction de cette face n'a pas été re-cherchée à la main après le passage en orbite :
   `FRONT_POSE` décrivait la rotation `R_front` qui amenait cette face vers +Z du temps où
   l'objet tournait ; l'objet portant maintenant `R_rest` et ne bougeant plus, la caméra doit
   se placer dans la direction `R_rest · R_front⁻¹ · ẑ`. La conversion est exacte, et le
   résultat est vérifié sur six allumages partis d'orientations différentes ;
2. simultanément le rayon d'orbite passe à ≈ 3.45 et le cadrage se décale.

   **Le zoom est interpolé en géométrique, pas en linéaire.** La taille apparente varie en
   1/distance : interpoler le rayon linéairement fait accélérer le grossissement vers la fin
   (l'échelle passait par 1×, 1.15×, 1.4×, 1.8×, 2.3× — les écarts se creusent). En
   géométrique (`from · (to/from)^e`), le taux de grossissement est constant, ce qui est la
   définition d'un zoom régulier.

   L'assouplissement est **sinusoïdal et non cubique** : une cubique in-out a une pente
   maximale de 3 à mi-course contre π/2 ≈ 1.57 ici. C'est ce pic de vitesse qui donnait
   l'impression que « d'un coup ça zoome » — il ne se passait presque rien, puis tout arrivait
   d'un bloc. Avec en plus la durée portée de 880 à 1500 ms et la profondeur ramenée de 2.29×
   à 2.09×, l'échelle apparente mesurée progresse par paliers de +0.07, +0.14, +0.24, +0.25,
   +0.14 : montée régulière et décélération franche, au lieu d'un pic ;
3. **la cible est tirée au sort à chaque allumage** dans une fourchette autour de
   `FRONT_POSE` (±0.15 rad en tangage, ±0.24 en lacet, ±0.38 en roulis, ±0.26 de recadrage) :
   on arrive toujours sur cette face, mais jamais exactement au même endroit ni au même
   angle. Sans ce désaccord, l'animation rejouait strictement la même image et faisait
   mécanique ;
4. à 620 ms le blanc monte (620 ms) pendant que la rotation finit : la coupure ne se voit pas ;
5. le dashboard apparaît en fondu depuis le blanc (520 ms).

Durée totale 1240 ms. `FRONT_POSE` a été relevée en balayant `?pose=` avec `pose.mjs`.

**Matériaux.** Le `.glb` arrive en `metalness: 1, roughness: 1`. Un métal parfaitement
rugueux n'a aucune composante diffuse : sans environment map il ne peut rendre que du gris
terne, ce qui ressortait mal sur le fond blanc. On repasse en diélectrique
(`metalness: 0, roughness: 0.42`) et la texture d'albédo redevient visible — luminance
moyenne mesurée sur les pixels du modèle : **229/255**, contre un gris franc auparavant.

**Interaction.** Trois niveaux, du plus discret au plus direct :

1. **Survol** — parallaxe interpolée (`lerp` 0.06) de ±14° en lacet et ±8° en tangage.
2. **Rotation libre** — 0.07 rad/s en continu, suspendue pendant un glissé et reprise au relâché.
3. **Glissé** — maintenir le bouton gauche *ou* droit et bouger fait tourner la console dans
   le sens du geste. Capture du pointeur pour que le glissé survive à une sortie de fenêtre,
   menu contextuel neutralisé sur le bouton droit.

   **Réglages relevés dans le bundle du site de référence**, qui monte un `<OrbitControls>` :

   ```
   enableZoom: false, enablePan: false, enableDamping: true,
   dampingFactor: 0.05, rotateSpeed: 0.5, autoRotate: true, autoRotateSpeed: 0.5
   ```

   Les deux valeurs qui font la sensation : `dampingFactor: 0.05` — le geste alimente une
   réserve dont on ne consomme que 5 % par frame, donc la console suit la main de loin et
   continue de glisser au relâché ; et `rotateSpeed: 0.5`, la moitié du défaut. Ma première
   version appliquait le geste directement avec un `lerp` à 0.3 et le gain plein : la console
   collait au curseur au lieu de tourner. L'amortissement est rendu indépendant de la
   fréquence d'écran (`1 - (1-d)^(dt·60)`), sinon un écran 120 Hz tourne deux fois plus vite.
   La rotation libre ne reprend qu'une fois la réserve épuisée, sinon les deux s'additionnent
   et le mouvement ne se pose jamais.

   **C'est la caméra qui orbite, pas la console qui tourne.** Point structurel, et la dernière
   chose corrigée : faire tourner l'objet en angles d'Euler ne respecte pas le geste. Dès que
   l'objet est incliné, un glissé horizontal ne tourne plus autour de la verticale de l'écran
   mais autour d'un axe penché — un cercle à la souris ne rend pas un cercle, et la conversion
   `Rz(−roll)` calculée une fois pour toutes ne peut pas corriger ça, puisqu'elle ne dépend
   pas de l'orientation courante. En coordonnées sphériques (`theta` azimut, `phi` polaire),
   le lacet reste toujours l'axe vertical de l'écran.

   **Test objectif** : `theta` et `phi` sont des sommes de `dx` et `dy`, donc un cercle fermé
   à la souris doit ramener exactement à la pose de départ. Mesuré sur un cercle de 70 px de
   rayon en 40 pas : **0.54 / 255 d'écart moyen** entre le départ et l'arrivée — c'est du
   bruit d'anticrénelage. En Euler, la composition n'étant pas commutative, la pose dérivait.

   L'orientation de repos est figée dans deux groupes imbriqués et ne bouge plus jamais ; le
   cadrage décalé, qui venait d'un décalage de position de l'objet, est devenu une translation
   de caméra dans son propre repère (un pur décalage à l'écran, constant quand on tourne).

   Subtilité : le groupe `roll` incline la scène de 77° dans le plan de l'écran, donc un
   glissé horizontal ne correspond **pas** à un lacet du modèle. On raisonne en rotation
   *écran* (`sx` autour de la verticale, `sy` autour de l'horizontale, bornée à ±1.1 rad) puis
   on la ramène dans le repère du modèle par `Rz(−roll)`. Sans cette conversion, tirer vers la
   droite fait basculer la console au lieu de la faire tourner. Vérifié en forçant `?pose=0,0,0,2.4` :
   à roll nul le mapping doit se réduire à `rotation.y += dx` et `rotation.x += dy`, ce qu'on
   contrôle sur `shots/_drag0.png`.

**Cible du clic.** C'est la console qui démarre la séquence, pas la légende du bas. Le clic
est validé par un raycast, contre une boîte englobante invisible (`colorWrite: false`) plutôt
que contre la géométrie complète — la 360 est un parallélépipède, et raycaster 50 000
triangles à chaque `pointermove` pour un retour de curseur serait absurde. Le curseur passe à
`pointer` au survol du modèle, à `grabbing` pendant le glissé. Un appui qui bouge de plus de
5 px est un glissé, pas un clic : on ne démarre pas.

**Clavier.** La scène est un vrai `<button>` : elle se prend au Tab, s'active à Entrée, et
affiche un liseré de focus en incrustation. Les clics souris y sont ignorés (`e.detail === 0`
distingue l'activation clavier) puisqu'ils passent par le raycast.

Sous `prefers-reduced-motion` : pas de rotation continue, pas de flash, transition en fondu
simple. Le glissé reste disponible — c'est une action de l'utilisateur, pas une animation.

---

## 8 bis. Effet vieille télé

Demandé après coup, avec une capture de référence montrant le rendu attendu. Le site de
référence l'obtient avec deux PNG que je reprends : `CRT_Scanlines_Colored.png` et
`CRT_FrameOnly.png`.

**Trois calques**, tous `position: fixed` et `pointer-events: none`, posés après le contenu :

| calque | rôle | recette |
|---|---|---|
| `.crt-soft` | l'image n'est pas nette | `backdrop-filter: blur(.5px) saturate(1.06)` |
| `.crt-scanlines` | les barres colorées | `background-size: cover`, `mix-blend-mode: screen`, `opacity: .2` |
| `.crt-frame` | coins arrondis, bord noir, vignette | `background-size: 100% 100%` |

**Calibration vérifiée.** Le motif source a une période de 3 px (cyan `#00ffc0`, rouge
`#f30032`, noir). Étiré en `cover`, il donne 12 px sur une capture de 2530 de large — et la
période relevée sur `reference/image2.png` est exactement de 12 px. L'amplitude de teinte
(R−B) vaut 11.6 sur la référence contre 12.7 sur mon rendu : même effet, à 10 % près.

**Le flou est un `backdrop-filter`, pas un `filter` sur un conteneur.** Envelopper
l'application dans un `filter` force la ré-rastérisation de tout l'arbre à chaque frame
d'animation : mesuré, les sons partaient 83 ms après le début de l'animation au lieu des
38 ms programmés, parce que le `setTimeout` attendait le thread principal. Le
`backdrop-filter` travaille sur le résultat déjà rastérisé — retour à 49 ms.

Les rayures et le cadre ne sont pas floutés : sur un vrai tube, c'est l'image qui est molle,
pas la grille d'ouverture.

**L'écran d'accueil ne reçoit que le flou** — ni rayures ni cadre, comme demandé.
Le cadre disparaît en plein écran (`:fullscreen`), sinon on encadre un cadre.

---

## 8 ter. Avatar 3D

Un personnage se tient devant la rangée sur image2. Le nôtre est fabriqué avec Meshy
(image → 3D → rig → animation) à partir d'un rendu de style avatar Xbox 360.

### Cadrage — relevé sur image2

| | valeur |
|---|---|
| hauteur | 44.9 % de la hauteur d'écran, soit 1.068 × une tuile sélectionnée |
| tête | 35.1 % du haut |
| pieds | 79.9 % du haut, soit 21.9 points **sous** la ligne d'horizon |
| centre horizontal | 36.5 % de la largeur |

La caméra est **orthographique** : une perspective ferait diverger la taille apparente
selon la distance, alors qu'on veut une hauteur à l'écran fixée par le relevé.

**Piège rencontré.** J'ai d'abord dimensionné le canevas à partir de la boîte du modèle
(1.70 unité pour un cadre de 2.0, donc 85 %). C'est faux : dans sa pose **animée**, le
personnage n'a ni les pieds à `y = 0` ni la tête à 1.70. Mesuré au rendu, il occupe 77.8 %
du canevas et ses pieds flottent à 7 % de la hauteur au-dessus du bord bas. Les cotes du
composant sont donc calées sur le rendu, pas sur la géométrie de repos — et vérifiées
stables à trois instants différents de l'animation (44.1 à 44.7 % pour 44.9 visés).

### Poids et chargement

Le modèle sorti de Meshy pesait **5,7 Mo**, dont **4 382 Ko pour une seule texture PNG
2048²** — 77 % du fichier. L'atlas UV est très fragmenté (des centaines d'îlots), ce qui
compresse atrocement mal en PNG. Réencodé en JPEG 1024² qualité 92 : **1,64 Mo**, soit
71 % de moins, pour un rendu indiscernable (vérifié en chargeant les deux versions et en
comparant au cadrage buste, bien plus près que ce que le dashboard montre).

L'outil est à la racine : `node tools-optimise-glb.mjs entree.glb sortie.glb 1024 92`.
Il reconstruit entièrement le chunk binaire du GLB en recalculant les offsets de tous les
`bufferViews`.

**Le chargement est différé.** three.js (688 Ko) et le modèle n'ont rien à faire dans le
chemin critique d'une page qui s'affiche en 176 ms : le composant sonde le fichier après
le premier rendu (`requestIdleCallback`), et n'importe three.js que si le modèle existe.
Vérifié : three.js reste un chunk séparé, le bundle principal ne prend que +7 Ko, et le
FCP médian sur cinq mesures reste à 196 ms.

### Le piège de la sonde

`firstAvailable` teste les assets avec `new Image()` — inutilisable pour un `.glb`. Mais
la sonde `fetch` qui l'a remplacée avait son propre piège : **un code 200 ne prouve pas
que le fichier existe.** Le serveur de dev de Vite comme le `try_files $uri $uri/
/index.html` de nginx renvoient la page HTML de l'application pour tout chemin inconnu.
La sonde validait donc `/assets/avatar.glb` inexistant, et le chargeur 3D recevait du
HTML. Il faut contrôler le `content-type` et rejeter `text/html`.

### Faire tourner le personnage

Maintenir le clic sur lui et glisser le fait pivoter de gauche à droite, sur 360° sans
butée. **Lacet uniquement** : pas de tangage, on ne veut ni le voir basculer ni découvrir
le dessous de ses semelles. Le modèle est centré en X et Z avec les pieds à `y = 0`, donc
une rotation autour de son axe vertical les laisse plantés — c'est le personnage qui
tourne, pas la caméra, contrairement à la console de l'écran d'accueil où il fallait une
orbite sphérique. Un `Group` intermédiaire porte la rotation pour ne pas perturber
l'animation qui joue en dessous.

Amortissement et gain repris d'`OrbitControls` comme pour la console (`dampingFactor`
0.05, `rotateSpeed` 0.5), mais **indexés sur la largeur du canevas, pas sa hauteur**. Le
canevas fait 160 × 384 px : indexé sur la hauteur, un tour complet demandait 766 px de
glissement, soit sept fois la largeur visible du personnage — on pousse beaucoup pour peu.
Sur la largeur, un tour se fait en 320 px. Le mapping physique « j'attrape la surface et
je pousse » (arc = r·θ, demi-largeur ≈ 55 px) donne 346 px indépendamment : les deux
convergent à 8 % près.

Deux contraintes ont façonné l'implémentation, toutes deux vérifiées par la mesure :

**L'avatar ne doit pas voler les clics des tuiles qu'il recouvre.** Il occupe 24 × 57,7 vh
au-dessus de la rangée ; le rendre cliquable créerait une zone morte devant la tuile 2. Le
conteneur reste donc `pointer-events: none`, l'écoute se fait au niveau de la fenêtre, et
un raycast sur une boîte de sélection décide si le curseur est réellement sur la
silhouette — seulement alors le conteneur devient cliquable. La boîte est en
`visible = false` : `Raycaster` ne teste que les calques, jamais la visibilité, elle reste
donc détectable sans être dessinée.

**Le geste ne doit pas déplacer la sélection.** Un tour fait 320 px et sort largement de
la boîte de l'avatar ; sans précaution, le curseur survole les tuiles traversées et la
sélection change en plein glissement — mesuré, elle passait de la tuile 0 à la 2. Un
bouclier `position: fixed` n'intercepte le survol que pendant la rotation.

En `prefers-reduced-motion`, la boucle de rendu est à l'arrêt : le geste est appliqué
immédiatement et la scène redessinée à la demande. Faire tourner le personnage est une
manipulation directe, pas une animation d'ambiance — la couper reviendrait à ignorer
l'utilisateur. Ce qu'on lui retire, c'est l'inertie, pas la réponse.

---

### 8 quater. L'avatar appartient à la rangée (image2 + image6)

Il n'est pas un décor planté à une position fixe : **il est arrimé à la tuile
d'indice 1** et suit sa profondeur. Les deux captures qui le montrent disent la
même chose, à des états de sélection différents — c'est ce qui rend le modèle
sûr plutôt que deviné :

| | image6 (« 1 of 5 », tuile 1 au fond) | image2 (« 2 of 5 », tuile 1 devant) |
|---|---|---|
| centre X / bord droit de la tuile 1 | 0.974 | 0.999 |
| pieds sous le centre de rangée (× h_tuile) | 0.564 | 0.556 |
| hauteur (× h_tuile de la tuile 1) | 1.138 | 1.079 |

Autrement dit : il se tient au bord droit de la tuile 1, il grandit et avance
avec elle quand on la sélectionne, et il sort de l'écran avec elle quand on
passe à la tuile 2.

Les valeurs sont exprimées **relativement à la tuile 1**, jamais en vh absolus :
les captures n'ont pas la même marge de rangée (15.3 vh sur image2, 14.5 sur
image6, 12.97 sur image4 d'où vient notre `--margin-x`), donc un vh recopié
serait faux chez nous. Vérification du modèle : il prédit le centre de l'avatar
d'image6 à 98.9 vh, mesuré 99.3.

Le canevas garde une taille en pixels constante (celle de la profondeur 0) et
c'est un `scale` CSS qui le fait avancer — redimensionner un canevas WebGL à
chaque image d'une transition coûterait une réallocation par image. L'origine de
la transformation est le point de contact des pieds au sol, donc une mise à
l'échelle ne les décolle jamais.

**Lame ouverte** (image10) : il quitte la rangée et fait un pas en avant à
droite — centre à 33.1 vh du bord droit, pieds à 87.9 % de la hauteur d'écran,
taille × 1.04. Il passe aussi **devant** le panneau, sinon son bras se fait
manger par le bord.

### 8 septies. Les semelles ne touchent pas le bas du cadre

Mesuré au rendu sur 12 instants d'animation : **14 à 15 px sur 405, soit 3.5 %
de la hauteur du bloc**. Dans sa pose animée le personnage ne pose pas ses
pieds à `y = 0` — je le supposais, donc il flottait de cette hauteur au-dessus
du sol et son ombre tombait sous ses semelles.

Le bloc est descendu de cet écart, et l'ombre remontée d'autant. Vérification :
dans la référence les pieds dépassent le bas de la tuile de 6.4 % de sa
hauteur, chez nous de 6.0 %.

L'ombre reste discrète — image6 n'en montre pas de marquée non plus.

### 8 quinquies. Le cadrage qui coupait les mains

Le personnage peut pivoter sur 360° : la largeur nécessaire n'est donc pas sa
largeur de face mais son **rayon horizontal maximal**. Mesuré au rendu sur 240
poses (24 lacets × 10 instants d'animation), en élargissant temporairement le
champ de la caméra pour ne pas saturer la mesure :

| grandeur | relevé |
|---|---|
| rayon horizontal max | 0.470 unité monde |
| sommet du crâne | 1.736 unité au-dessus du sol |

D'où un cadre de 1.80 unité de haut (juste ce qu'il faut au-dessus du crâne) et
un rapport largeur/hauteur de 0.56 — le minimum strict serait 0.522. Avant, le
cadre valait 24 vh pour 228 px nécessaires : les mains sortaient et se
faisaient couper net.

**La rotation tourne à plein régime pendant le geste.** Le plafond à 30 i/s ne
se voit pas sur une respiration lente, mais très bien sur un objet qui suit la
souris : c'est le décalage curseur/personnage qui devient saccadé. Le plafond ne
protège l'ordonnancement des sons que pendant la navigation au clavier — or on
ne navigue pas au clavier en faisant tourner l'avatar à la souris.

---

### 1 ter. Le fond animé est un système de particules

Relevé dans `components/Background.qml` du thème Pegasus NPE, qui l'implémente
au paramètre près. Ce n'est ni un dégradé qui respire ni un calque qui glisse :

| grandeur | valeur |
|---|---|
| émission | 2 par seconde, zone ancrée en haut à droite sur 80 % × 80 % |
| durée de vie | 10 000 ms ± 4 000 |
| déplacement | `AngleDirection` angle 320° ± 20, magnitude 25 ± 5 px/s |
| opacité | 0.15 |
| image | `bg_ring{1..4}.png`, 256 px, tirée au hasard |
| échelle | de `random × 0.125` vers `random × 0.875 + 0.125` sur 14 000 ms |

L'échelle est programmée sur 14 s alors que l'anneau ne vit que 10 : il meurt
avant d'atteindre sa taille finale, et c'est ce décalage qui donne des tailles
si variées.

J'avais d'abord fabriqué six anneaux fixes qui dérivaient ensemble. Ça ne
ressemblait à rien, et pour une raison de fond : ce qui fait vivre ce fond
n'est pas un mouvement d'ensemble mais le fait que chaque anneau naisse,
grandisse et meure avec ses propres valeurs.

Chaque anneau porte sa trajectoire dans des variables CSS et une animation qui
dure toute sa vie — aucune boucle JS par image, seul l'ajout et le retrait
passent par un timer. Une vingtaine d'anneaux vivent à un instant donné.

### 2 ter. Rayon des coins

Mesuré au zoom 4× sur le coin de la tuile 0 d'image6 : **15 à 16 px sur une
tuile haute de 561**, soit 1.15 vh, ou 2.76 % de la hauteur de tuile. La valeur
en place était 0.45 vh — deux fois et demie trop peu, et les cartes paraissaient
presque carrées.

La détection automatique échoue ici : au coin haut-gauche la tuile et le fond
sont tous deux verts et clairs, le saut de luminance ne dépasse pas 2 unités.
Le coin bas-gauche, contre le sol gris, est en revanche parfaitement net — et
un agrandissement au plus proche voisin donne la lecture directement.

### 2 bis. Chaque carte a son motif, pas sa couleur

Le thème NPE embarque **huit fonds de carte** en 420 × 320 — le format exact de
nos tuiles. Leurs couleurs moyennes tiennent en 5 unités les unes des autres
(#a0cb28 à #add02a) : c'est bien le **motif de ronds** qui change d'une carte à
l'autre, pas la teinte. J'avais fait varier la teinte, ce qui n'était pas
demandé et contredisait les captures.

---

### 8 sexies. Ce que le bundle du site de référence a tranché

Trois points où j'ai relevé plutôt qu'inventé, en lisant son CSS et ses chunks.

**Le fond n'a PAS d'animation d'ambiance.** `.bg` et `.bgFloor` sont deux
images fixes, sans `animation` ni `transition` en CSS. Ce qu'on prend pour un
fond animé est une **mise en scène d'entrée** : le sol est un composant piloté
par un état, `transform: translateY(100vh) → translateY(0)`, avec quatre
durées selon le sens et la vitesse —

| sens | transition |
|---|---|
| descente lente | `transform 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)` |
| remontée lente | `transform 1.0s cubic-bezier(0.65, 0, 0.35, 1)` |
| descente rapide | `transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)` |
| remontée rapide | `transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)` |

On reprend la remontée lente (1 s) à l'arrivée dans le dashboard, et les cartes
se posent l'une après l'autre avec 90 ms de décalage.

**Le curseur est un élément DOM, pas une propriété CSS.** `.custom-cursor` :
`position: fixed`, `z-index: 100010`, `pointer-events: none`,
`image-rendering: pixelated`, `filter: drop-shadow(2px 2px 2px rgba(0,0,0,.5))`,
et deux PNG de 17 × 22 (`default`, `pointer`), la variante « pointer » décalée
de −5 px pour aligner les deux pointes. Couleur échantillonnée sur les
fichiers : **#a6ff00 cerné de noir**.

**Piège payé dessus.** Masquer le curseur natif avec `cursor: none !important`
écrase la valeur calculée de *tous* les éléments. Or je lisais justement cette
valeur pour choisir la forme — la variante « pointer » ne pouvait donc jamais
s'afficher, et le test de parcours, qui localisait la console de la même façon,
échouait. La forme se déduit maintenant de la nature de l'élément survolé, et
les deux cas 3D (console, silhouette de l'avatar) exposent leur état de raycast
sous forme de classe — un raycast ne se lit pas dans le DOM.

---

## 9. Assets

### 9.1 Récupérés depuis le site de référence (originaux Microsoft)

`bg.png`, `bgFloor.png`, `cards/BlankGreen.jpg`, `cards/PanelShadow.png`,
`cards/icon_{musiclib,picturelib,videolib,gamelib,settings}.png`, `BackgroundPanel.png`,
`GScore.png`, `Legend_A.png`, `Legend_B.png`, `Legend_Highlight.png`, `Legend_Menu.png`,
`SphereHighlight.png`, `AvatarShadow.png`, `redstar.png`, `3qredstar.png`,
`fonts/Convection.ttf`, `3d/xbox.glb`, et les 12 `.wav` du §7.

### 9.2 Recréations open source vérifiées

| dépôt | licence |
|---|---|
| `jeffscottward/xbox-360-dash` | **aucune licence déclarée** → non réutilisable |
| `mochamap1e/x360` | aucune licence déclarée (API GitHub en limite de débit au moment du contrôle) |
| `riquenunes/pegasus-theme-npe` | idem |
| `ZivvoZ/dashx360` | idem |

Aucun code n'en est repris. Sans licence explicite, le droit d'auteur par défaut s'applique.
Le seul intérêt qu'ils auraient eu — les assets — est de toute façon couvert par §9.1,
et à la source.

### 9.3 Dossier `public/assets/` optionnel

Si un fichier existe, il l'emporte sur la version générée. Testé au démarrage par un `HEAD`
sur chaque chemin, avec repli silencieux.

| chemin | usage | repli |
|---|---|---|
| `public/assets/background.jpg` | ciel | `public/nxe/bg.png`, sinon dégradé CSS |
| `public/assets/floor.png` | sol | `public/nxe/bgFloor.png`, sinon dégradé CSS |
| `public/assets/tile.png` | texture de tuile | `public/nxe/BlankGreen.jpg`, sinon dégradé CSS |
| `public/assets/icons/<id>.png` | glyphe d'une tuile | glyphe SVG `<NxeGlyph>` |
| `public/assets/avatar.png` | vignette de profil | carré vert généré |
| `public/assets/sfx/{move,select,back}.wav` | sons | `public/audio/*.wav`, sinon silence |
| `public/xbox360.glb` | modèle 3D | géométrie procédurale |

---

## 10. Mobile — proposition (à valider, mais je code celle-ci)

Le brief demande d'adapter plutôt que de dégrader, et de proposer la solution ici avant de
la coder. Voici le raisonnement et la décision.

Une rangée en perspective repose sur trois choses qui disparaissent toutes sur un écran de
6 pouces : de la largeur, un curseur qui n'est pas un doigt, et une distance de lecture de
2 mètres. Rétrécir la rangée donne quatre timbres-poste illisibles. **Mais** le NXE possède
déjà, dans son propre langage, une forme verticale : la lame de détail (image3, image5) —
liste de lignes pleine largeur, ligne active en dégradé vert brillant, séparateurs fins.

**Décision : sous 820 px de large (ou en portrait), on passe de l'idiome « rangée de tuiles »
à l'idiome « lame », qui est authentiquement NXE.**

- Le fond ne change pas. `bg.png` + `bgFloor.png` + vignette, horizon relevé à 0.42 H pour
  laisser respirer la liste. C'est l'identité visuelle, elle survit au format.
- Les tuiles deviennent des cartes pleine largeur empilées, ratio 16:7, avec **exactement**
  la même texture, le même voile sombre, le même glyphe, la même typographie de titre et de
  sous-titre. La carte active est à taille pleine, les autres à 92 % avec un voile à 25 %.
- Le reflet au sol est conservé, réduit à 0.16 de la hauteur de carte.
- L'en-tête passe de trois lignes à deux (nom + section courante), corps à 0.055 H.
  Le bloc profil garde pseudo + vignette, perd la ligne de score.
- Le pied de page conserve les pastilles A et B — c'est une signature visuelle forte — mais
  elles deviennent de vrais boutons tactiles de 44 px (A = ouvrir, B = revenir).
- Le panneau de détail passe en plein écran et monte depuis le bas, avec le même dépliage.
- Balayage horizontal = changement de section ; balayage vertical = liste. Les flèches et la
  manette continuent de fonctionner si un clavier/une manette est connecté.
- L'écran d'accueil 3D est conservé mais rendu à `min(devicePixelRatio, 1.5)`, et remplacé
  par une image fixe si `navigator.connection.saveData` est vrai.

---

## 11. Plancher de qualité

- Focus clavier visible : contour `2px solid #cfe86a` + halo `0 0 0 4px rgba(124,184,33,.35)`
  sur tous les éléments focusables, jamais supprimé.
- `prefers-reduced-motion: reduce` : toutes les transitions passent à 0.01 ms, la respiration
  du fond, la rotation 3D et le flash sont désactivés, les sons restent.
- Chargement < 2 s : `bg.png` et `bgFloor.png` en `<link rel="preload">`, Convection en
  `font-display: swap`, three.js chargé en `import()` dynamique uniquement pour l'écran
  d'accueil, sons chargés paresseusement à la première interaction.
- Zéro erreur console : vérifié à chaque itération par `compare.mjs`, qui échoue si un
  `console.error` ou une `pageerror` survient.

---

## 11 bis. Ce que la boucle de comparaison a corrigé

Dix itérations `compare.mjs` + `measure.mjs`. Ce que je croyais au moment d'écrire
les sections précédentes, et que les captures ont démenti :

**Le reflet au sol n'est pas un miroir.** J'avais dupliqué la tuile entière,
retournée et atténuée. Résultat : une bande verte sombre sous la tuile, alors que
la référence n'en a aucune. Relevé au pixel sur image4, juste sous la tuile :
`#8f969d` contre `#8c929e` en sol nu — **+3 seulement**. Et à l'endroit du titre
inversé : +6 à +12. Le NXE ne renvoie que *la lumière*, pas la matière. La copie
ne contient donc plus que le texte, par-dessus un halo blanc à 7.5 %.
Gain mesuré sur la bande sous les tuiles : 12/13/11 → 11/9/7.

**L'inclinaison des glyphes est déjà dans les fichiers.** J'appliquais
`rotate(-13deg)` par-dessus des PNG où l'appareil photo de `icon_picturelib` est
*déjà* penché — donc deux fois. Supprimé pour les PNG, conservé (−9°) pour les
glyphes SVG maison, qui eux sont dessinés droits.

**Les glyphes SVG sortaient deux fois trop petits.** Un `<svg width:auto;
height:100%>` dans un conteneur en largeur « shrink-to-fit » se replie sur une
taille arbitraire au lieu d'utiliser le ratio de son `viewBox`. Corrigé avec
`aspect-ratio: 207 / 288` sur le conteneur — le format des PNG NXE — et un
canevas SVG recalé sur les mêmes proportions (glyphe dans la bande 7 %–65 %).

**`evenodd` ne perce pas entre `<path>` distincts.** Les touches du clavier et
les œillets du serveur ne se découpaient pas : chaque sous-chemin était un
élément séparé, donc rempli isolément. Il faut tout mettre dans un seul `d`.

**`BackgroundPanel.png` doit être étiré, pas répété.** C'est un dégradé 75 × 75
(`#465056` → `#262f38`), pas un motif. Répété, il donnait un matelassage qui
n'existe nulle part dans les références.

**Le corps de texte se déduit de la hauteur de capitale, pas de la largeur.**
Les deux méthodes divergeaient de ~19 %. En mesurant le « 1 » de « mopo1o »
(37 px de haut) et les hampes du « m » (27 px d'x-height), on obtient un corps de
53.6 px — et l'écart de largeur restant s'explique par **0.09 em d'interlettrage**,
valeur retrouvée indépendamment sur « Projects » (0.092) et « Gabriel's Portfolio »
(0.092). Les titres de tuiles, eux, n'en ont pas.

**Le pas horizontal n'est pas géométrique.** Un facteur unique de 0.79 laissait
15 px d'erreur sur la deuxième tuile — visible. Les décalages cumulés sont donc
codés en dur pour les quatre premières tuiles (0, 0.748, 1.461, 2.013), et
prolongés géométriquement au-delà.

**Le fil d'Ariane et le compteur disparaissent quand une lame est ouverte.**
Ni image3 ni image5 ne les montrent.

**Scores finaux** (différence absolue moyenne par pixel, 0 = identique) :

| vue | itération 1 | itération 10 |
|---|---|---|
| `boot` | 32.95 | **2.80** |
| `dash-projets` | 12.71 | **12.63** |
| `dash-accueil` | 14.87 | **15.67** |
| `fullhd` (1920 × 1080) | 17.07 | **17.21** |
| `blade` | 37.01 | **39.02** |

Ces chiffres sont à lire avec précaution, et surtout pas comme une note : les
références montrent le contenu d'un *autre* portfolio. Là où image4 a une photo
de Pepe plein cadre, ce site a une tuile verte unie avec une note de musique — la
différence de pixels est énorme et parfaitement souhaitable. Le score de `blade`
monte justement parce qu'assombrir le bandeau du panneau arrière (correction
juste) l'éloigne du logo blanc de la référence. Les indicateurs qui comptent sont
la grille de blocs de `compare.mjs`, les planches côte à côte, et `measure.mjs` :

```
  tile0.left      cible  86.6   obtenu  86.5
  tile0.top             246.5          245.8
  tile0.height          279.5          279.5
  tile1.right           665.0          665.4
  crumb1.capTop          43.5           44.3
  crumb3.capTop         102.5          102.9
  avatar.size            61.5           61.5
  legendA.centerY       611.3          611.2
  orb.size              100.5          100.5
```

Tout est dans ±2 px sauf `tile2.right` (−5.1 px), résidu de la non-uniformité du
pas décrite plus haut.

---

## 12. Écarts assumés

- L'arc de l'horizon est celui de `bgFloor.png` ; si l'utilisateur remplace le sol par son
  propre `floor.png` droit, l'arc disparaît. Documenté dans le README.
- Convection n'a qu'une graisse. Le « gros et gras » du brief pour la ligne 3 de l'en-tête est
  rendu par la taille et le contraste, comme dans l'original.
- Les captures de référence sont en ratio 1.90 et compressées (artefacts visibles : fines
  rayures horizontales dans les aplats). Je ne reproduis pas ces artefacts.
- Le pas horizontal de la rangée est non uniforme dans les références (0.748, 0.874, 0.793
  fois la largeur de la tuile précédente). Les quatre premières positions sont calées au
  relevé ; au-delà de la quatrième tuile, la progression est géométrique et s'écarte donc
  potentiellement de ce qu'aurait fait l'original. Reste ~5 px d'écart sur la troisième tuile.
- L'écran d'accueil montre la console en rotation lente et continue : sa pose exacte à un
  instant donné ne peut pas coïncider avec la capture figée d'image1. La pose de départ est
  calée dessus (grille en haut à gauche, axe long à −28°), `?spin=0` la fige pour la comparaison.
- La vignette de profil par défaut est un dégradé doré généré, pas un gamerpic. Dépose
  `public/assets/avatar.png` pour la remplacer.
- Le panneau arrière de la lame affiche la texture de tuile assombrie là où la référence
  affiche une image de projet. Renseigne `image` sur une tuile dans `src/data/content.ts`
  pour retrouver le rendu d'origine.
- **Le cadre CRT dégrade volontairement les scores de `compare.mjs`.** Les captures de
  `reference/` sont rognées et n'ont pas le liseré noir arrondi, alors que la capture de
  référence fournie ensuite l'a. Vérifié par la carte des écarts bloc à bloc : la hausse est
  entièrement sur les bords (+6 et +8 dans les coins), l'intérieur bouge de +0 à +1 (le flou).
  Le métrique mesure ici une différence voulue.
- Le test du parcours a été rendu déterministe en deux passes : il re-localise la console
  après l'avoir tournée (elle glisse encore, le point relevé avant devenait faux), et il vise
  le **centroïde** des points survolés plutôt que le premier trouvé (un point pris sur le bord
  tombe à côté pendant que la console tourne lentement). Sans ça, ~1 exécution sur 6 échouait.
- ~~L'avatar reste derrière la lame quand un panneau s'ouvre.~~ **Levé le 26/08.**
  J'avais laissé l'avatar caché faute de références concordantes : image3 le montrait
  déplacé à droite, image5 n'en montrait aucun. image10 tranche à deux contre un, et
  elle est nette. Il est désormais affiché à droite quand une lame est ouverte, aux cotes
  d'image10 (§ 8 quater). C'est un bon exemple de la règle « n'induis pas une règle
  générale d'un seul cas » : attendre une troisième capture valait mieux que trancher.
- **L'avatar est affiché sur toutes les sections**, alors qu'image4 (*Projects*) n'en
  montre pas. La référence semble le conditionner à la section ; je ne reproduis pas cette
  règle, faute de pouvoir la déduire des captures disponibles.
- **La taille des glyphes de tuile n'est pas confirmée au relevé.** À l'œil, le glyphe de
  la référence paraît plus grand que le nôtre. Toutes mes tentatives de mesure ont été
  contaminées : par l'avatar qui recouvre la tuile porteuse sur image2 et image6, par la
  tache lumineuse de la tuile (dont le bleu monte à 160, au-dessus d'un seuil « blanc »
  naïf), et par le dégradé blanc → vert-jaune des icônes elles-mêmes, qui met en échec
  tout seuil de luminance. La seule comparaison propre — même icône forcée, même taille de
  tuile — donne des largeurs à 5 % près et un centre horizontal à 0.493 contre 0.502.
  **Je n'ai donc rien changé** : la règle du projet est de remesurer, jamais de corriger à
  l'œil. À reprendre avec une capture de référence où une tuile à glyphe est entièrement
  dégagée.
- **L'onde sous l'orbe est ~6 fois plus contrastée que le relevé** (+15 unités de
  luminance contre +2.5 mesurées sur image11). Au relevé exact elle serait quasi invisible
  sur un écran ordinaire ; l'intention est respectée, l'intensité non.
- **Le bandeau de notification (image7) et le lecteur audio (image9) ne sont pas
  implémentés.** Ils n'ont pas d'équivalent dans le contenu du portfolio.
- **Le son part plus tard qu'avant les ajouts du 26/08** : médiane ~75 ms depuis la frappe
  contre 50–60 auparavant, pour un plafond de 110. Les calques animés (onde, anneaux du
  fond) et la boucle de l'avatar coûtent réellement du fil principal. Deux corrections ont
  déjà récupéré du budget (respiration du ciel passée en `transform`, anneaux promus sur
  leur propre calque) ; le reste est assumé et reste dans la borne.
- **La console de l'écran d'accueil est plus grosse que sur image1** (échelle 2.1 au lieu de
  1.75) et sa zone cliquable déborde nettement de sa silhouette : demandé explicitement, pour
  qu'on puisse cliquer à côté sans avoir à viser une forme fine.
