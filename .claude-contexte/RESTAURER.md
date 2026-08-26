# Reprendre le travail sur une autre machine

---

## Le plus simple : demande-le à Claude

Ouvre `claude` dans le dossier cloné et colle ceci :

> Lis `.claude-contexte/RESTAURER.md` et applique la section « Consignes pour
> Claude ». Ensuite remets-toi en contexte sur le projet et dis-moi où on en
> était.

Il fait tout seul la remise en mémoire et la copie des fichiers. Une seule chose
lui échappe : l'historique de la conversation (cf. « Ce qui ne peut pas être
automatisé » plus bas).

---

## Consignes pour Claude

Si tu lis ceci sur une machine fraîchement clonée, voici quoi faire, dans
l'ordre. Ne demande pas de validation entre les étapes.

**1. Retrouve le nom du dossier de session.** Il est dérivé du chemin absolu du
projet, séparateurs remplacés par des tirets :
`c:\Users\oxyfu\Desktop\Portfolio` → `c--Users-oxyfu-Desktop-Portfolio`.
Vérifie avec `ls ~/.claude/projects/` : si un dossier correspond au chemin
courant, utilise-le ; sinon crée-le.

**2. Recopie la mémoire.**

```bash
DEST=~/.claude/projects/<le-bon-nom>
mkdir -p "$DEST"
cp -r .claude-contexte/memory "$DEST"/
cp .claude-contexte/*.jsonl   "$DEST"/ 2>/dev/null || true
```

**3. Charge la mémoire dans la session courante.** Les fichiers de `memory/` ne
sont lus qu'au démarrage : recopiés en cours de session, ils ne s'appliqueront
qu'à la suivante. Lis-les donc directement maintenant —
`.claude-contexte/memory/MEMORY.md` puis chaque fichier qu'il référence — et
tiens-en compte immédiatement.

**4. Remets-toi dans le projet.** Dans cet ordre : `CLAUDE.md` (les règles de
travail et les pièges déjà payés — c'est le plus important), puis `SPEC.md`
§ 11 bis et § 12 (ce que la boucle a corrigé, et les écarts assumés qui restent
ouverts).

**5. Vérifie que l'environnement est sain** et rapporte le résultat sans le
maquiller :

```bash
npm install
npx playwright install chromium
npx tsc -b --noEmit
node test-flow.mjs
```

Attendu : zéro erreur TypeScript, **31 assertions / 0 échec**. La suite mesure
le délai des sons en médiane de cinq — s'il dépasse, mesure la cause en
isolation avant de conclure à une régression (cf. `CLAUDE.md`).

**6. Dis à Nolan où on en était**, y compris ce qui reste ouvert.

---

## Ce qui ne peut pas être automatisé

**L'historique de la conversation.** Le transcript (`*.jsonl`, ~61 Mo) dépasse
largement ce qui tient en contexte : il ne peut pas être « lu pour se
souvenir ». Le seul moyen de le récupérer est `claude --resume`, qui exige que
le fichier soit **déjà en place au lancement**.

Donc soit tu fais cette copie avant d'ouvrir Claude :

```bash
mkdir -p ~/.claude/projects/c--Users-oxyfu-Desktop-Portfolio
cp .claude-contexte/*.jsonl ~/.claude/projects/c--Users-oxyfu-Desktop-Portfolio/
claude --resume
```

…soit tu laisses Claude la faire à l'étape 2, tu quittes, et tu relances avec
`claude --resume`.

**À ne jamais copier :** `~/.claude/.credentials.json`, c'est le jeton du
compte. Connecte-toi normalement.

**Hors dépôt :** `~/.claude/settings.json`, si tu veux les mêmes réglages —
`{ "model": "opus", "effortLevel": "high", "autoUpdatesChannel": "latest", "tui": "fullscreen" }`

---

## Ce qu'il y a dans ce dossier

| fichier | rôle |
|---|---|
| `memory/MEMORY.md` | l'index chargé au démarrage de chaque session |
| `memory/*.md` | une mémoire par fichier (profil, méthode, projet) |
| `*.jsonl` | le transcript intégral |

## Si tout ça échoue

Ce n'est pas grave, et c'est voulu. **Le vrai contexte est le dépôt lui-même** :

- `CLAUDE.md` — les règles de travail et les pièges déjà payés, un par ligne ;
- `SPEC.md` — toutes les mesures, les décisions, les écarts assumés ;
- `shots/` — les 350 captures de la boucle de fidélité ;
- `reference/` — les 11 captures qui ont servi à mesurer.

Un projet qui ne se comprend qu'avec son transcript est un projet mal documenté.
Celui-ci se reprend sans.
