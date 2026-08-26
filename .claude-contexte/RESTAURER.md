# Reprendre la conversation sur une autre machine

Ce dossier contient le contexte de Claude Code : sa mémoire et le transcript
complet de la session. Il n'est pas nécessaire au site — il sert uniquement à
reprendre le travail là où il s'est arrêté.

| fichier | rôle |
|---|---|
| `memory/MEMORY.md` | l'index chargé au démarrage de chaque session |
| `memory/*.md` | une mémoire par fichier (profil, méthode de travail, projet) |
| `5276ad9f-….jsonl` | le transcript intégral (~64 Mo) |

---

## Le seul vrai piège : le nom du dossier de session

Claude range chaque session dans `~/.claude/projects/<nom>`, où `<nom>` est le
**chemin absolu du projet avec les séparateurs remplacés par des tirets** :

```
c:\Users\oxyfu\Desktop\Portfolio   →   c--Users-oxyfu-Desktop-Portfolio
```

Si tu clones ailleurs — autre nom d'utilisateur, `Documents` au lieu de
`Desktop` — ce nom change, Claude regarde dans un dossier vide et ne retrouve
rien. Tout le reste en découle.

## Cas 1 — même chemin qu'à l'origine

Le plus simple. Même nom d'utilisateur Windows, même emplacement :

```bash
cd ~/Desktop
git clone https://github.com/Oxyfun/Portfolio-NXE.git Portfolio
cd Portfolio
mkdir -p ~/.claude/projects/c--Users-oxyfu-Desktop-Portfolio
cp -r .claude-contexte/memory  ~/.claude/projects/c--Users-oxyfu-Desktop-Portfolio/
cp .claude-contexte/*.jsonl    ~/.claude/projects/c--Users-oxyfu-Desktop-Portfolio/
npm install
claude --resume
```

`--resume` propose la session ; tu la choisis et tu reprends avec l'historique.

## Cas 2 — chemin différent

Lance `claude` une fois dans le dossier cloné pour qu'il crée son dossier, puis
repère son nom et copie dedans :

```bash
ls ~/.claude/projects/
cp -r .claude-contexte/memory ~/.claude/projects/<le-nouveau-nom>/
cp .claude-contexte/*.jsonl   ~/.claude/projects/<le-nouveau-nom>/
```

---

## Ce qu'il ne faut PAS copier

**`~/.claude/.credentials.json`** — c'est le jeton du compte. Connecte-toi
normalement sur l'autre machine.

## Ce qui n'est pas dans le dépôt (hors projet)

`~/.claude/settings.json`, si tu veux les mêmes réglages :

```json
{ "model": "opus", "effortLevel": "high", "autoUpdatesChannel": "latest", "tui": "fullscreen" }
```

---

## Si la restauration échoue

Ce n'est pas grave, et c'est voulu. La mémoire seule suffit à redémarrer : les
quatre fichiers de `memory/` disent qui tu es, la méthode de travail validée et
l'état du projet.

Et surtout, **le vrai contexte est le dépôt lui-même** — c'est la raison d'être
de ces fichiers :

- `CLAUDE.md` — les règles de travail et les pièges déjà payés, un par ligne ;
- `SPEC.md` — toutes les mesures, les décisions, et les écarts assumés ;
- `shots/` — les 350 captures de la boucle de fidélité ;
- `reference/` — les 11 captures qui ont servi à mesurer.

Un projet qui ne se comprend qu'avec son transcript est un projet mal documenté.
Celui-ci se reprend sans.
