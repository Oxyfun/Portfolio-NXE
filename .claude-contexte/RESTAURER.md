# Reprendre la conversation sur une autre machine

Ce dossier contient le contexte de Claude Code : sa mémoire et le transcript
complet de la session. Il n'est pas nécessaire au site — il sert uniquement à
reprendre le travail là où il s'est arrêté.

## Ce qu'il y a dedans

| fichier | rôle |
|---|---|
| `memory/MEMORY.md` | l'index chargé au démarrage de chaque session |
| `memory/*.md` | une mémoire par fichier (profil, méthode de travail, projet) |
| `5276ad9f-….jsonl` | le transcript intégral (~64 Mo) |

## Où les remettre

Claude Code range son état dans un dossier dont le nom est **dérivé du chemin
du projet**. Sur la machine d'origine :

```
C:\Users\oxyfu\.claude\projects\c--Users-oxyfu-Desktop-Portfolio\
├── 5276ad9f-….jsonl
└── memory\
```

Le segment `c--Users-oxyfu-Desktop-Portfolio` est simplement
`c:\Users\oxyfu\Desktop\Portfolio` avec les séparateurs remplacés par des
tirets. **Si tu clones ailleurs, ce nom change.** Deux cas :

**Même chemin** (`C:\Users\<toi>\Desktop\Portfolio` avec le même nom
d'utilisateur) — recopie tel quel :

```bash
cp -r .claude-contexte/memory "$HOME/.claude/projects/c--Users-oxyfu-Desktop-Portfolio/"
cp .claude-contexte/*.jsonl   "$HOME/.claude/projects/c--Users-oxyfu-Desktop-Portfolio/"
```

**Chemin différent** — lance d'abord `claude` une fois dans le dossier cloné
pour qu'il crée son dossier, repère son nom dans `~/.claude/projects/`, puis
copie dedans.

Ensuite, `claude --resume` propose la session et tu reprends avec l'historique.

## Si ça ne marche pas

La mémoire seule suffit largement à redémarrer : les quatre fichiers de
`memory/` contiennent l'essentiel (qui tu es, la méthode de travail validée, le
projet). Et surtout, **le vrai contexte est dans le dépôt lui-même** :
`CLAUDE.md` porte les règles et les pièges déjà payés, `SPEC.md` toutes les
mesures et les décisions, `shots/` les captures de chaque itération.
