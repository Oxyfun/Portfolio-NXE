---
name: projet-portfolio-nxe
description: "Portfolio NXE — objectif, contraintes non déductibles du code, et point de vigilance sur les droits"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5276ad9f-385e-49dd-951e-63dceee77108
  modified: 2026-08-25T07:38:26.295Z
---

Portfolio personnel de Nolan reproduisant le dashboard **New Xbox Experience** (Xbox 360,
2008–2010). Démarré le 24 août 2026.

**Critère de réussite fixé par Nolan** : qu'une personne ayant connu la console reconnaisse
le dashboard en moins de deux secondes. La fidélité visuelle prime sur la richesse
fonctionnelle. Un prototype précédent avait échoué exactement là-dessus (fond bleu nuit,
tuiles en verre translucide, icônes en emoji) — ne jamais y retourner.

**Source des assets** : <https://gabrielcabrera.co/> sert les assets NXE d'origine en clair
(fond, texture de tuile, icônes, police Convection, sons, modèle 3D). C'est ce qui rend la
fidélité atteignable. Les captures de `reference/` viennent de ce site.

**Point de vigilance sur les droits** : Nolan croyait ces assets libres de droit. Ils ne le
sont pas (Convection est propriétaire Microsoft/Monotype, images et sons viennent du
firmware). Signalé, accepté, documenté dans `CREDITS.md`, et chaque asset a un repli généré
en code pour que le site tourne sans eux. À re-signaler si le projet part sous un nom
commercial.

Les décisions techniques et les mesures vivent dans `SPEC.md` du projet, pas ici.
Voir [[user-nolan]] et [[feedback-methode-mesure]].
