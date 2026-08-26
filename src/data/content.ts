/**
 * ============================================================================
 *  TOUT LE CONTENU DU SITE EST DANS CE FICHIER.
 *  Tu peux l'éditer sans toucher au reste du projet.
 *  Voir README.md § « Éditer le contenu ».
 * ============================================================================
 */

/** Glyphes disponibles. Les cinq premiers sont les icônes NXE d'origine. */
export type GlyphId =
  | 'musiclib'
  | 'picturelib'
  | 'videolib'
  | 'gamelib'
  | 'settings'
  // glyphes dessinés en SVG dans le même langage visuel
  | 'home'
  | 'cloud'
  | 'terminal'
  | 'school'
  | 'mail'
  | 'server'
  | 'music'
  | 'search'
  | 'keyboard'
  | 'film'

/** Une ligne du panneau de détail. */
export interface DetailRow {
  label: string
  /** Si présent, la ligne devient un lien (s'ouvre dans un nouvel onglet). */
  href?: string
}

/** Une paire libellé / valeur dans l'encart d'infos du panneau. */
export interface DetailStat {
  label: string
  value: string
}

/** Une tuile du dashboard. */
export interface Tile {
  id: string
  title: string
  subtitle: string
  glyph: GlyphId
  /** Optionnel : image de fond de la tuile (dans public/). Sinon texture verte NXE. */
  image?: string
  detail: {
    /** Titre du bandeau orange. Par défaut : le titre de la tuile. */
    heading?: string
    stats: DetailStat[]
    body: string[]
    rows: DetailRow[]
  }
}

export interface Section {
  id: string
  label: string
  tiles: Tile[]
}

/** Bloc profil en haut à droite. */
export const profile = {
  gamertag: 'nolan',
  score: '2026',
  /** Optionnel : public/assets/avatar.png. Sinon vignette générée. */
  avatar: '/assets/avatar.png',
}

/** Ligne du milieu de l'en-tête — le nom du site. */
export const siteName = 'Portfolio de Nolan'

export const sections: Section[] = [
  // ── ACCUEIL ───────────────────────────────────────────────────────────────
  {
    id: 'accueil',
    label: 'Accueil',
    tiles: [
      {
        id: 'moi',
        title: 'Nolan',
        subtitle: 'Alternant ingénieur cloud',
        glyph: 'home',
        detail: {
          stats: [
            { label: 'Poste', value: 'Alternant' },
            { label: 'Entreprise', value: 'Carrefour' },
            { label: 'Équipe', value: 'OneCloud' },
          ],
          body: [
            "Je suis alternant ingénieur cloud chez Carrefour, dans l'équipe OneCloud. Je construis des chaînes CI/CD et de l'infra as code pour les équipes produit du groupe.",
            "En parallèle je fais du Bachelor à l'ESGI, et je monte des projets perso : de la génération de musique par IA, des outils que j'utilise vraiment, un homelab sur VPS.",
          ],
          rows: [
            { label: 'Voir mes projets' },
            { label: 'Voir mon parcours' },
            { label: 'Me contacter' },
          ],
        },
      },
      {
        id: 'carrefour',
        title: 'Carrefour — OneCloud',
        subtitle: 'Alternance en cours',
        glyph: 'cloud',
        detail: {
          heading: 'CARREFOUR — ONECLOUD',
          stats: [
            { label: 'Rôle', value: 'Ingénieur cloud' },
            { label: 'Clouds', value: 'GCP / Azure' },
            { label: 'Statut', value: 'En poste' },
          ],
          body: [
            "OneCloud est l'équipe qui fournit la plateforme cloud interne du groupe. Je travaille sur l'outillage que les équipes produit utilisent pour livrer.",
            "Concrètement : des templates CI/CD exposés via Backstage, du Terraform pour provisionner sur GCP et Azure, des pipelines GitLab CI, et des automatisations n8n pour tout ce qui traînait en manuel.",
          ],
          rows: [{ label: 'Détail des technos' }],
        },
      },
      {
        id: 'esgi',
        title: 'ESGI',
        subtitle: 'Bachelor en cours',
        glyph: 'school',
        detail: {
          stats: [
            { label: 'Diplôme', value: 'Bachelor' },
            { label: 'Statut', value: 'En cours' },
            { label: 'Suite', value: 'Master IA/Data' },
          ],
          body: [
            "Bachelor à l'ESGI, en alternance avec Carrefour.",
            "Objectif ensuite : un Master IA/Data. C'est là que mes projets perso et mon boulot se rejoignent — j'ai envie de faire de la donnée et du modèle, pas seulement de la plomberie autour.",
          ],
          rows: [{ label: 'Voir le parcours complet' }],
        },
      },
    ],
  },

  // ── PROJETS ───────────────────────────────────────────────────────────────
  {
    id: 'projets',
    label: 'Projets',
    tiles: [
      {
        id: 'ia-music',
        title: 'Musique IA 24/7',
        subtitle: 'Lives YouTube en continu',
        glyph: 'music',
        detail: {
          heading: 'MUSIQUE IA 24/7',
          stats: [
            { label: 'Type', value: 'Projet perso' },
            { label: 'Diffusion', value: 'YouTube live' },
            { label: 'Uptime', value: '24/7' },
          ],
          body: [
            "Génération de musique par IA, diffusée en continu sur des lives YouTube 24 heures sur 24.",
            "La chaîne complète tourne toute seule : génération des morceaux, contrôle qualité, constitution de la playlist, encodage et envoi du flux. Ce qui est intéressant, ce n'est pas le modèle, c'est de tenir un flux qui ne tombe jamais.",
          ],
          rows: [{ label: 'Voir la chaîne', href: '#' }],
        },
      },
      {
        id: 'alternance',
        title: 'Agrégateur alternance',
        subtitle: "Offres tech, un seul endroit",
        glyph: 'search',
        detail: {
          heading: 'AGRÉGATEUR ALTERNANCE',
          stats: [
            { label: 'Type', value: 'Projet perso' },
            { label: 'Domaine', value: 'Tech' },
            { label: 'Sources', value: 'Multiples' },
          ],
          body: [
            "Un agrégateur d'offres d'alternance en tech. Je l'ai écrit parce que chercher une alternance veut dire ouvrir dix sites qui affichent les mêmes annonces avec dix filtres différents.",
            "Il collecte, déduplique, normalise les intitulés et laisse filtrer sur ce qui compte vraiment : la techno, le rythme d'alternance et la zone.",
          ],
          rows: [{ label: 'Voir le projet', href: '#' }],
        },
      },
      {
        id: 'dactylo',
        title: 'Dactylo par EPUB',
        subtitle: "S'entraîner sur ses propres livres",
        glyph: 'keyboard',
        detail: {
          heading: 'DACTYLO PAR EPUB',
          stats: [
            { label: 'Type', value: 'Projet perso' },
            { label: 'Entrée', value: 'Fichier EPUB' },
            { label: 'Sortie', value: 'Exercices' },
          ],
          body: [
            "Un site d'entraînement à la dactylographie où on importe un EPUB : le texte à taper, c'est le livre.",
            "Le parsing découpe le bouquin en passages de longueur régulière, garde la ponctuation réelle, et suit la vitesse et les erreurs par touche. Beaucoup plus motivant que des phrases générées.",
          ],
          rows: [{ label: 'Essayer', href: '#' }],
        },
      },
      {
        id: 'letterboxd',
        title: 'Random Letterboxd',
        subtitle: 'Un film au hasard dans ta watchlist',
        glyph: 'film',
        detail: {
          heading: 'RANDOM LETTERBOXD',
          stats: [
            { label: 'Type', value: 'Projet perso' },
            { label: 'Source', value: 'Letterboxd' },
            { label: 'Usage', value: 'Quotidien' },
          ],
          body: [
            "Un sélecteur aléatoire de films depuis une watchlist Letterboxd.",
            "Le problème n'a jamais été de trouver quoi regarder, mais de choisir. L'outil lit la watchlist, applique quelques filtres (durée, décennie, déjà vu ou non) et tranche à ma place.",
          ],
          rows: [{ label: 'Ouvrir', href: '#' }],
        },
      },
      {
        id: 'homelab',
        title: 'Homelab VPS',
        subtitle: 'n8n, Minecraft, et le reste',
        glyph: 'server',
        detail: {
          heading: 'HOMELAB VPS',
          stats: [
            { label: 'Type', value: 'Infra perso' },
            { label: 'Hôte', value: 'VPS' },
            { label: 'Services', value: 'n8n, Minecraft' },
          ],
          body: [
            "Un homelab sur VPS où je fais tourner ce dont j'ai besoin : n8n pour mes automatisations, un serveur Minecraft, et les services qui vont avec.",
            "Tout est en conteneurs derrière un reverse proxy, avec des sauvegardes qui se déclenchent seules. C'est là que je casse des choses avant de les proposer au boulot.",
          ],
          rows: [{ label: 'Détail de la stack' }],
        },
      },
    ],
  },

  // ── COMPÉTENCES ───────────────────────────────────────────────────────────
  {
    id: 'competences',
    label: 'Compétences',
    tiles: [
      {
        id: 'cloud',
        title: 'Cloud',
        subtitle: 'GCP, Azure',
        glyph: 'cloud',
        detail: {
          stats: [
            { label: 'GCP', value: 'Quotidien' },
            { label: 'Azure', value: 'Quotidien' },
            { label: 'Contexte', value: 'Multi-cloud' },
          ],
          body: [
            "Je provisionne et j'opère sur GCP et Azure en parallèle, dans un contexte multi-cloud assumé.",
            "Réseau, IAM, gestion des identités de service, quotas, coûts. La partie la moins visible et la plus structurante.",
          ],
          rows: [],
        },
      },
      {
        id: 'iac',
        title: 'Infra as code',
        subtitle: 'Terraform, GitLab CI',
        glyph: 'terminal',
        detail: {
          heading: 'INFRA AS CODE',
          stats: [
            { label: 'Terraform', value: 'Modules' },
            { label: 'CI', value: 'GitLab CI' },
            { label: 'Portée', value: 'GCP + Azure' },
          ],
          body: [
            "Terraform pour tout ce qui se provisionne, en modules réutilisables plutôt qu'en copier-coller entre projets.",
            "GitLab CI pour l'appliquer : plan sur la merge request, apply sur la branche principale, états distants verrouillés.",
          ],
          rows: [],
        },
      },
      {
        id: 'platform',
        title: 'Plateforme & CI/CD',
        subtitle: 'Backstage, n8n',
        glyph: 'settings',
        detail: {
          heading: 'PLATEFORME & CI/CD',
          stats: [
            { label: 'Backstage', value: 'Templates' },
            { label: 'n8n', value: 'Automatisations' },
            { label: 'But', value: 'Self-service' },
          ],
          body: [
            "Backstage comme porte d'entrée : les équipes créent un service depuis un template et repartent avec un dépôt, une pipeline et une infra déjà câblés.",
            "n8n pour tout ce qui reste : synchronisations, notifications, tâches récurrentes qui n'ont aucune raison d'être faites à la main.",
          ],
          rows: [],
        },
      },
    ],
  },

  // ── PARCOURS ──────────────────────────────────────────────────────────────
  {
    id: 'parcours',
    label: 'Parcours',
    tiles: [
      {
        id: 'now',
        title: 'Aujourd’hui',
        subtitle: 'Carrefour + ESGI',
        glyph: 'cloud',
        detail: {
          heading: 'AUJOURD’HUI',
          stats: [
            { label: 'Entreprise', value: 'Carrefour' },
            { label: 'École', value: 'ESGI' },
            { label: 'Rythme', value: 'Alternance' },
          ],
          body: [
            "Alternant ingénieur cloud chez Carrefour dans l'équipe OneCloud, en Bachelor à l'ESGI.",
            "Le rythme alternance me va bien : ce que je vois en cours, je l'applique dans la semaine, et l'inverse est encore plus vrai.",
          ],
          rows: [],
        },
      },
      {
        id: 'next',
        title: 'Ensuite',
        subtitle: 'Master IA / Data',
        glyph: 'school',
        detail: {
          stats: [
            { label: 'Cible', value: 'Master' },
            { label: 'Domaine', value: 'IA / Data' },
            { label: 'Statut', value: 'Visé' },
          ],
          body: [
            "Un Master IA/Data après le Bachelor.",
            "J'ai commencé par l'infra et j'y suis à l'aise. Ce que je veux ajouter, c'est le traitement de la donnée et les modèles — la partie que mes projets perso grattent déjà sans que j'aie la théorie derrière.",
          ],
          rows: [],
        },
      },
    ],
  },

  // ── CONTACT ───────────────────────────────────────────────────────────────
  {
    id: 'contact',
    label: 'Contact',
    tiles: [
      {
        id: 'contact',
        title: 'Me contacter',
        subtitle: 'Email, LinkedIn, GitHub',
        glyph: 'mail',
        detail: {
          heading: 'ME CONTACTER',
          stats: [
            { label: 'Réponse', value: 'Sous 48 h' },
            { label: 'Langue', value: 'FR / EN' },
            { label: 'Dispo', value: 'Alternance' },
          ],
          body: [
            "Le plus simple, c'est l'email. LinkedIn marche aussi.",
            "Remplace les liens ci-dessous dans src/data/content.ts.",
          ],
          rows: [
            { label: 'Email', href: 'mailto:REMPLACER@example.com' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/REMPLACER' },
            { label: 'GitHub', href: 'https://github.com/REMPLACER' },
          ],
        },
      },
    ],
  },
]
