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
- Le **corps d'un texte se déduit de la hauteur de capitale**, pas de sa largeur (19 % d'écart,
  dû à l'interlettrage). À défaut, l'**interligne** est un relevé fiable et indépendant.
- Les **PNG d'icônes NXE contiennent le glyphe dans leurs 58 % supérieurs** et son reflet en
  dessous. Dimensionne sur le fichier entier. L'inclinaison y est déjà dessinée : pas de
  `rotate`.
- Un `<svg>` en `width: auto` dans un conteneur en largeur « shrink-to-fit » **ne prend pas le
  ratio de son `viewBox`**. Mets un `aspect-ratio` explicite.
- `fill-rule="evenodd"` ne perce **que dans un même attribut `d`**. Des `<path>` séparés sont
  remplis isolément.
- `BackgroundPanel.png` est un **dégradé 75×75 à étirer**, pas un motif à répéter.
- Le **reflet au sol n'est pas un miroir** : +3 unités RVB sous la tuile. Le NXE ne renvoie
  que la lumière ; un miroir produit une bande sombre qui n'existe pas.
- `Box3.setFromObject` renvoie une boîte **monde**. Neutralise les transformations parentes
  avant de calculer une boîte locale.
- Pour faire tourner un objet à la souris **sur deux axes**, orbite la caméra en sphériques,
  ne le fais pas tourner en Euler : incliné, un glissé horizontal ne tourne plus autour de la
  verticale de l'écran et un cercle ne rend pas un cercle (test : un cercle fermé doit
  ramener à la pose de départ, mesuré 0.54/255). Pour un **seul** axe, tourner l'objet est
  plus juste — l'avatar pivote en lacet, ce qui garde ses pieds au sol.
- Un gain de rotation **s'indexe sur la dimension que le geste parcourt**. `OrbitControls`
  prend la hauteur du canevas ; sur l'avatar (160 × 384) ça demandait 766 px pour un tour.
  Recoupe par le mapping physique arc = r·θ : ici 320 contre 346 px, ils convergent.
- **Un élément qui flotte au-dessus d'autres ne doit pas leur voler leurs clics.** Garde-le en
  `pointer-events: none`, écoute sur la fenêtre, et ne le rends cliquable qu'une fois le
  raycast confirmé. `Raycaster` ignore `visible` : la boîte de sélection peut être invisible.
- **Un glissé qui sort de sa boîte survole ce qu'il traverse** (l'avatar déplaçait la
  sélection de la tuile 0 à la 2). Un bouclier plein écran pendant le geste — et qui survit
  au relâchement, sinon le survol reprend sous un curseur qui a bougé de 320 px.
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
- Dans une animation qui enchaîne mouvement et fondu, **vérifie que le fondu ne démarre pas
  avant la fin du mouvement**. Le cas court (partir du repos) masque le bug.
- Un zoom se **dose en géométrique**, pas en linéaire (la taille apparente varie en
  1/distance). Et sinusoïde plutôt que cubique : pente max 1.57 contre 3, c'est ce pic à
  mi-course qui fait « d'un coup ça bouge ».
- **`filter` sur un conteneur qui enveloppe l'app ré-rastérise tout l'arbre à chaque frame.**
  Mesuré : les sons partaient à 83 ms au lieu de 38. Utilise `backdrop-filter` sur un calque.
- Un `useRef` **ne redéclenche pas de rendu**. Pour piloter une classe CSS, il faut un état.
- **Un code HTTP 200 ne prouve pas qu'un fichier existe** : Vite en dev comme nginx renvoient
  la page HTML pour tout chemin inconnu. Contrôle le `content-type`. Et `firstAvailable`
  sonde avec `new Image()` : hors images, utilise `firstFileAvailable`.
- Pour cadrer un modèle 3D, mesure-le **dans sa pose animée**, pas sur sa boîte de repos. Et
  s'il peut pivoter, ce qu'il faut c'est son **rayon** horizontal max, pas sa largeur de face.
- Les modèles 3D sortis d'IA arrivent avec une **texture 2048² de plusieurs mégaoctets qui
  fait 80 % du poids**. Réencoder en JPEG 1024 suffit et ne se voit pas. Le nombre de
  polygones n'est presque jamais le problème.
- Un matériau `metalness: 1, roughness: 1` **n'a aucune composante diffuse**. Sans environment
  map il ne peut rendre que du gris terne. Le `.glb` de la console arrive comme ça : repasse
  en diélectrique (`metalness: 0`) pour retrouver du blanc.
- Avant d'inventer un réglage d'interaction, **regarde ce que fait le site de référence** :
  son bundle est lisible et ses constantes sont les bonnes (`<OrbitControls rotateSpeed=0.5
  dampingFactor=0.05>` pour la console, `background-size: cover` pour les rayures CRT).
  Trois réglages devinés ont été corrigés comme ça, dont le choix orbite/Euler.

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
- **Vérifie empiriquement plutôt qu'au jugé.** Quand un signe ou une direction est ambigu,
  fabrique le cas où il est évident plutôt que de raisonner en boucle. Idem quand une mesure
  te surprend : instrumente et regarde la valeur, ne théorise pas deux fois de suite.
- **Écris l'outil quand il fera gagner du temps** (`pose.mjs`, `measure.mjs`, la prise de
  mesure `window.__avatar` en dev). Un script jetable en une passe vaut trois allers-retours.
- Les scripts de mise au point temporaires vont dans le scratchpad ou en `*.tmp.mjs`
  supprimé après usage. Ne laisse pas de déchets à la racine.
- **Un test qui échoue une fois sur six est un bug, pas du bruit.** Cherche la course
  (un état transitoire échantillonné après coup, une position relevée avant que la scène
  bouge) plutôt que d'allonger les délais.
- **N'échantillonne pas une grandeur bruitée une seule fois.** Un `setTimeout` sous charge
  donnait 115 ms pour une médiane réelle de 50. Prends la médiane de cinq et **garde la borne
  intacte** — on fiabilise la mesure, on ne relâche pas l'exigence. Et avant de conclure à
  une régression, mesure la cause en isolation.
- Pour comparer une typographie, **rends la MÊME chaîne que la référence**, même résolution,
  même boîte. Compare la largeur du mot et la densité d'encre — pas l'épaisseur d'un fût.
  Même principe pour un glyphe : force la même icône des deux côtés, sinon tu compares des
  formes et pas des tailles.
- **Dis les écarts qui subsistent.** Ne présente jamais comme identique ce qui ne l'est pas.
  La section « Écarts assumés » de `SPEC.md` doit rester à jour et honnête.
- **N'induis pas une règle générale d'un seul cas de référence.** image3 déplaçait l'avatar
  quand une lame s'ouvre, image5 non. J'ai retenu le comportement le plus simple, documenté
  comme écart — et image10, arrivée plus tard, a tranché. Attendre valait mieux qu'inventer.
- Quand une consigne repose sur une prémisse fausse (ex. « ces assets sont libres de droit »),
  dis-le en une phrase, propose l'atténuation, **et fais quand même le travail demandé**.

---

## Journal des décisions

Les décisions et les corrections trouvées en itérant s'écrivent dans **`SPEC.md`** :
§ 11 bis pour ce que la boucle a corrigé, § 12 pour les écarts assumés.
Pas ici — ce fichier doit rester sous 200 lignes et ne contenir que des règles.

Quand tu ajoutes une fonctionnalité, mets à jour dans le même passage : `SPEC.md`,
`README.md` (commandes et raccourcis), `CREDITS.md` si un asset externe entre, et
`test-flow.mjs` si un comportement testable change.
