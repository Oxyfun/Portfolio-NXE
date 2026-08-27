# Portfolio NXE — instructions de travail

Reconstitution du dashboard New Xbox Experience (Xbox 360, 2008–2010) en portfolio.
Vite + React + TS, three.js pour l'accueil, build statique derrière nginx, aucun backend.

`SPEC.md` = les mesures et les décisions. `README.md` = comment lancer et éditer.
`CREDITS.md` = ce qui vient de Microsoft et sous quelles réserves.
**Ne recopie rien de ces trois fichiers ici.**

---

## La règle qui gouverne tout

**La fidélité visuelle prime. Et on mesure, on n'estime pas.**

Toute valeur numérique dans le CSS vient d'un relevé au pixel sur `reference/*.png`.
Avant d'écrire une taille, une couleur, une position ou une opacité :

1. échantillonne la référence (Python + Pillow, cf. les scripts jetables du scratchpad) ;
2. écris la valeur obtenue ;
3. mets un commentaire d'une ligne au-dessus disant d'où elle sort.

Si tu changes une valeur commentée, remesure. Ne « corrige à l'œil » jamais.

Quand un relevé contredit une consigne de l'utilisateur, **le relevé gagne** — et tu le dis
explicitement dans la réponse. C'est comme ça qu'on a trouvé que les tuiles ne sont pas
carrées (1.3125:1), que le ciel ne s'éclaircit pas vers la droite, et que les tuiles ne
descendent pas mais rétrécissent autour de la ligne d'horizon.

---

## Commandes qui prouvent un changement

```bash
npx tsc -b --noEmit     # avant tout commit, zéro erreur
node test-flow.mjs      # parcours complet accueil → dashboard → lame → retour
npm run compare         # capture, compare aux références, écrit dans shots/
node measure.mjs        # géométrie du DOM vs cotes de reference/image4.png
node audit.mjs          # console, chargement, focus, reduced-motion, responsive
```

`measure.mjs` est le juge de la géométrie, pas `compare.mjs`. Vise **±2 px** sur chaque cote.
Les scores de `compare.mjs` **ne sont pas une note** : les références montrent le contenu d'un
autre portfolio, un score qui monte n'est pas forcément une régression. Après un changement
visuel, **regarde la capture** — ne conclus jamais depuis le seul chiffre.

---

## Pièges déjà payés

Chacun a coûté au moins une itération. Ne les repaie pas.

- `reference/image4.png` a **34 px de barre navigateur en haut** : retranche-les. Les captures
  sont en ratio ~1.90, pas 16:9 — les mesures en « % de largeur » ne sont pas transposables,
  d'où la scène décrite en `vh`.
- Le **corps d'un texte se déduit de la hauteur de capitale**, pas de sa largeur. À défaut,
  l'**interligne** est un relevé fiable et indépendant.
- Les **PNG d'icônes NXE contiennent le glyphe dans leurs 58 % supérieurs** et son reflet en
  dessous. Dimensionne sur le fichier entier. L'inclinaison y est déjà dessinée : pas de
  `rotate`.
- Un `<svg>` en `width: auto` dans un conteneur « shrink-to-fit » **ne prend pas le ratio de
  son `viewBox`**. Mets un `aspect-ratio` explicite.
- `fill-rule="evenodd"` ne perce **que dans un même attribut `d`**. Des `<path>` séparés sont
  remplis isolément.
- `BackgroundPanel.png` est un **dégradé 75×75 à étirer**, pas un motif à répéter.
- Le **reflet au sol n'est pas un miroir** : +3 unités RVB sous la tuile. Le NXE ne renvoie
  que la lumière ; un miroir produit une bande sombre qui n'existe pas.
- `Box3.setFromObject` renvoie une boîte **monde**. Neutralise les transformations parentes
  avant de calculer une boîte locale.
- Pour faire tourner un objet à la souris **sur deux axes**, orbite la caméra en sphériques :
  incliné, un glissé horizontal ne tourne plus autour de la verticale de l'écran (test : un
  cercle fermé doit ramener à la pose de départ, 0.54/255). Pour un **seul** axe, tourner
  l'objet est plus juste — l'avatar pivote en lacet, ses pieds restent au sol.
- Un gain de rotation **s'indexe sur la dimension que le geste parcourt**. `OrbitControls`
  prend la hauteur du canevas ; sur l'avatar (160 × 384) ça demandait 766 px pour un tour.
  Recoupe par le mapping physique arc = r·θ : ici 320 contre 346 px, ils convergent.
- **Un élément qui flotte au-dessus d'autres ne doit pas leur voler leurs clics.** Garde-le en
  `pointer-events: none` et ne le rends cliquable qu'après confirmation du raycast.
  `Raycaster` ignore `visible` : la boîte de sélection peut être invisible.
- **Un glissé qui sort de sa boîte survole ce qu'il traverse.** Un bouclier plein écran
  pendant le geste, qui survit au relâchement — sinon le survol reprend sous un curseur qui
  a bougé de 320 px.
- **`prefers-reduced-motion` ne coupe pas la réponse à une manipulation directe.** Si la
  boucle est arrêtée, applique le geste et redessine à la demande. On retire l'inertie, pas
  la réaction.
- **Un ancêtre transformé fait qu'un `position: fixed` se cale sur LUI, pas sur la fenêtre.**
  Monte ce genre de calque sur `document.body`.
- **Un rectangle mis en cache doit être invalidé quand l'élément bouge**, pas seulement au
  redimensionnement : marque-le sale sur `transitionend`.
- Animer `background-position` **repeint** le calque à chaque image ; `transform` est
  composité. Sur un fond plein écran, la différence se lit sur le retard des sons.
- Une bordure **sous-pixel est arrondie vers le bas** à densité 1 : un anneau de 1.5 px
  devient 1 px, et à faible opacité il disparaît.
- Les captures postérieures à image5 **portent l'effet CRT du site de référence** : moyenne
  sur ~8 lignes avant toute lecture de couleur, sinon tu relèves les rayures.
- **Un seuil de luminance ne sait pas isoler un glyphe en dégradé** (les icônes NXE vont du
  blanc au vert-jaune, la tache de la tuile monte à un bleu de 160). Règle générale : si une
  mesure sature sur les bords de ta zone de recherche, elle est fausse — ne conclus pas.
- **Un voile plein écran vole les clics de tout ce qui passe dessous.** Deux causes empilées
  sur la légende (`<span>` non cliquables ET `z-index` trop bas) : corriger une seule ne
  changeait rien. Playwright désigne ce coupable seul (« X intercepts pointer events »).
- **Masquer le curseur natif efface la valeur qu'on voulait lire** : `cursor: none !important`
  écrase le `cursor` calculé partout. Et un raycast n'est pas dans le DOM — expose-le en classe.
- **Avant d'inventer une animation, cherche-la dans les dépôts de `reference/Site`.** Le fond
  du NXE est un **système de particules** (`Background.qml`, thème Pegasus NPE), pas un calque
  qui dérive. Ces dépôts contiennent aussi les huit motifs de carte : le motif change d'une
  carte à l'autre, pas la teinte.
- Un accumulateur de molette est **faux dans les deux sens** (une souris saute une carte, un
  pavé tactile n'en franchit aucune). Prends le SIGNE du premier événement, verrouille 320 ms.
- `e.target` **n'est pas toujours un `Element`** : sur `window` ou `document`, `?.closest()`
  lève une exception et le gestionnaire cesse de fonctionner. `instanceof Element`.
- Une **boîte encastrée plus sombre** au milieu d'un panneau se lit comme un trou. La
  référence pose son contenu à même la surface quand il n'y a pas d'image.
- Quand deux propriétés composent un même changement d'état (fond + couleur du texte),
  **transitionne les deux** — et vérifie qu'elles sont interpolables : un `linear-gradient`
  ne s'anime pas depuis `transparent`, il saute. Le plus sûr est de tout rendre instantané.
- **Un calque plein écran qui ferme quelque chose doit avoir un `z-index` explicite**, sinon
  il vole les clics de ses voisins. `.blade-scrim` l'a fait deux fois : à la légende, puis au
  panneau de détail (qui est en `z-index: -1` pour passer derrière la lame).
- Une **ombre au sol se centre sur la ligne de contact**, mesurée au rendu. Trop haut elle
  disparaît derrière les jambes, trop bas le personnage flotte au-dessus. Ce qui la rend
  visible c'est sa taille, pas son décalage.
- Un élément qui **réapparaît** n'a pas besoin du même fondu que pour disparaître : 220 ms de
  fondu laissaient le fond nu et produisaient un flash (+6.4 unités mesurées, ramené à +0.1).
- Une mesure impossible d'un côté l'est peut-être **de l'autre** : le coin haut d'une tuile
  n'a aucun contraste, le coin bas en a beaucoup. Et un agrandissement au plus proche voisin
  se lit directement, sans détecteur.
- Pour rejouer une animation CSS, la classe doit être **réellement retirée du DOM** entre-temps :
  sans un cadre d'arrêt, React regroupe les deux états et rien ne redémarre.
- **Ne valide jamais un défilement sans l'avoir fait déborder** : injecte du texte, puis
  regarde `scrollTop` bouger aux flèches ET à la molette.
- Dans un `transform`, un **pourcentage se rapporte à l'élément**, pas à la fenêtre :
  `translate(calc(100% - …))` collait l'avatar au bord gauche. Utilise `100vw`.
- Deux objets qui bougent ensemble ont besoin de la **même `transform-origin`**, et une
  position relative à une tuile se calcule sur sa largeur **à sa profondeur** (`tileW × Kʳ`),
  pas sur sa largeur pleine : 126 px d'erreur, ramenés à 3 px du relevé.
- Un test qui vise une **tuile dépassée** vise le vide : elles sortent par la gauche, avec
  une abscisse négative. Cible toujours une tuile encore à l'écran.
- Dans une animation qui enchaîne mouvement et fondu, **vérifie que le fondu ne démarre pas
  avant la fin du mouvement**. Le cas court (partir du repos) masque le bug.
- Un zoom se **dose en géométrique**, pas en linéaire (la taille apparente varie en
  1/distance). Et sinusoïde plutôt que cubique : pente max 1.57 contre 3, c'est ce pic à
  mi-course qui fait « d'un coup ça bouge ».
- **`filter` ré-rastérise tout le sous-arbre à chaque frame** (sons à 83 ms au lieu de 38).
  Sur un calque plein écran, `backdrop-filter` ; sur un panneau, un fond suffit.
- Un `useRef` **ne redéclenche pas de rendu**. Pour piloter une classe CSS, il faut un état.
- **Un code HTTP 200 ne prouve pas qu'un fichier existe** : Vite en dev comme nginx renvoient
  la page HTML pour tout chemin inconnu. Contrôle le `content-type`. Et `firstAvailable`
  sonde avec `new Image()` : hors images, utilise `firstFileAvailable`.
- Pour cadrer un modèle 3D, mesure-le **dans sa pose animée**. S'il pivote, ce qu'il faut est
  son **rayon** horizontal max, pas sa largeur de face. Et ses **semelles ne touchent pas le
  bas du cadre** (3.5 % mesurés) : sans ça il flotte.
- Les modèles 3D sortis d'IA arrivent avec une **texture 2048² de plusieurs mégaoctets qui
  fait 80 % du poids**. Réencoder en JPEG 1024 suffit et ne se voit pas. Le nombre de
  polygones n'est presque jamais le problème.
- Un matériau `metalness: 1, roughness: 1` **n'a aucune composante diffuse**. Sans environment
  map il ne peut rendre que du gris terne. Le `.glb` de la console arrive comme ça : repasse
  en diélectrique (`metalness: 0`) pour retrouver du blanc.
- Avant d'inventer un réglage d'interaction, **lis le bundle du site de référence** : ses
  constantes sont les bonnes (`OrbitControls rotateSpeed=0.5 dampingFactor=0.05`). Plusieurs
  réglages devinés ont été corrigés comme ça.

---

## Conventions du code

- **Français partout** : commentaires, textes du site, messages de test. Ton direct, pas de
  jargon marketing.
- Un commentaire explique **pourquoi**, jamais quoi. Sur une valeur relevée, il dit la source.
- L'interface est en **`font-weight: 600` synthétique**, posé sur `body`. Convection n'a
  qu'une graisse, donc le navigateur le fabrique — c'est voulu, et c'est ce que fait
  l'original (densité d'encre mesurée sur quatre chaînes d'image4, cf. SPEC § 6.1).
- Les couleurs de texte sont **opaques**. Un `rgba(255,255,255,…)` sur le fond vert laisse
  passer le vert et verdit le texte : mesuré #829b5a au lieu de #adbd92.
- **Aucun emoji dans l'interface.** Les glyphes sont des PNG NXE ou des SVG dessinés dans le
  même langage (formes épaisses, coins très arrondis, dégradé blanc → vert-jaune, reflet, ombre).
- La scène est décrite en **`vh`**, pas en `%` de largeur : une projection perspective se
  dimensionne sur le champ de vision vertical.
- Tout asset passe par la cascade `public/assets/` → `public/nxe/` → généré en CSS.
  **Le site doit s'afficher avec les dossiers d'assets vides.** Ne casse jamais ce repli.
- Tout le contenu éditorial vit dans `src/data/content.ts`. Aucun texte de site ailleurs.

---

## Plancher de qualité — non négociable

À vérifier avec `node audit.mjs` avant de livrer :

- zéro erreur console (`compare.mjs` échoue si `console.error` ou `pageerror`) ; `load` < 2 s ;
- focus clavier visible sur tout élément focusable, jamais supprimé ;
- `prefers-reduced-motion: reduce` neutralise toutes les transitions ;
- les sons partent **38–45 ms après** le début de l'animation, jamais en même temps.

Le mobile **adapte, il ne dégrade pas** : sous 820 px on bascule de l'idiome « rangée en
perspective » vers l'idiome « lame », lui aussi authentiquement NXE. Fond, texture, glyphes,
typographie et pastilles inchangés.

---

## Manière de travailler

- **Itère seul.** Boucle construire → capturer → regarder → lister les écarts → corriger,
  jusqu'à ce que ce soit difficile à distinguer de la référence.
- **Vérifie empiriquement plutôt qu'au jugé.** Fabrique le cas où le signe est évident, et
  quand une mesure surprend, instrumente — ne théorise pas deux fois de suite.
- **Écris l'outil quand il fera gagner du temps** (`pose.mjs`, `window.__avatar` en dev).
- Les scripts jetables vont dans le scratchpad ou en `*.tmp.mjs` supprimé après usage.
- **Un test qui échoue une fois sur six est un bug, pas du bruit.** Cherche la course (état
  transitoire lu après coup, position relevée avant que la scène bouge), n'allonge pas les délais.
- **N'échantillonne pas une grandeur bruitée une seule fois** (115 ms lus pour une médiane
  réelle de 50). Médiane de cinq, **borne intacte**. Et avant de conclure à une régression,
  mesure la cause en isolation.
- Pour comparer une typographie, **rends la MÊME chaîne**, même résolution, même boîte.
  Compare la largeur du mot et la densité d'encre. Même principe pour un glyphe : force la
  même icône des deux côtés, sinon tu compares des formes, pas des tailles.
- **Dis les écarts qui subsistent.** « Écarts assumés » dans `SPEC.md` doit rester honnête.
- **N'induis pas une règle générale d'un seul cas de référence.** image3 déplaçait l'avatar
  quand une lame s'ouvre, image5 non. J'ai retenu le comportement le plus simple, documenté
  comme écart — et image10, arrivée plus tard, a tranché. Attendre valait mieux qu'inventer.
- Quand une consigne repose sur une prémisse fausse, dis-le en une phrase, propose
  l'atténuation, **et fais quand même le travail demandé**.

---

## Journal des décisions

Les décisions et les corrections trouvées en itérant s'écrivent dans **`SPEC.md`** :
§ 11 bis pour ce que la boucle a corrigé, § 12 pour les écarts assumés.
Pas ici — ce fichier doit rester sous 200 lignes et ne contenir que des règles.

Quand tu ajoutes une fonctionnalité, mets à jour dans le même passage : `SPEC.md`,
`README.md` (commandes et raccourcis), `CREDITS.md` si un asset externe entre, et
`test-flow.mjs` si un comportement testable change.
