/**
 * ============================================================================
 *  TOUT LE CONTENU DU SITE EST DANS CE FICHIER.
 *  Tu peux l'éditer sans toucher au reste du projet.
 *  Voir README.md § « Éditer le contenu ».
 * ============================================================================
 */

/** Glyphes disponibles. Les cinq premiers sont les icônes NXE d'origine. */
export type GlyphId =
  | "musiclib"
  | "picturelib"
  | "videolib"
  | "gamelib"
  | "settings"
  // glyphes dessinés en SVG dans le même langage visuel
  | "home"
  | "cloud"
  | "terminal"
  | "school"
  | "mail"
  | "server"
  | "music"
  | "search"
  | "keyboard"
  | "film";

/** Une ligne du panneau de détail. */
export interface DetailRow {
  label: string;
  /** Si présent, la ligne devient un lien (s'ouvre dans un nouvel onglet). */
  href?: string;
}

/** Une paire libellé / valeur dans l'encart d'infos du panneau. */
export interface DetailStat {
  label: string;
  value: string;
}

/** Une tuile du dashboard. */
export interface Tile {
  id: string;
  title: string;
  subtitle: string;
  glyph: GlyphId;
  /** Optionnel : image de fond de la tuile (dans public/). Sinon texture verte NXE. */
  image?: string;
  detail: {
    /**
     * Titre du bandeau orange. Par défaut : le titre de la tuile, tel quel.
     * Les références l'affichent dans sa casse d'origine (« mopo1o »,
     * « TTS.Mom ») : on ne met donc pas en capitales automatiquement. Écris-le
     * en capitales ici si tu le veux ainsi.
     */
    heading?: string;
    stats: DetailStat[];
    body: string[];
    rows: DetailRow[];
  };
}

export interface Section {
  id: string;
  label: string;
  tiles: Tile[];
}

/** Bloc profil en haut à droite. */
export const profile = {
  gamertag: "nolan",
  score: "2026",
  /** Optionnel : public/assets/avatar.png. Sinon vignette générée. */
  avatar: "/assets/avatar.png",
};

/**
 * Nom du site. Il n'apparaît plus dans l'en-tête depuis que le fil d'Ariane est
 * devenu une roue de sections (SPEC § 3 bis) ; gardé pour le jour où il servira
 * ailleurs.
 */
export const siteName = "Portfolio de Nolan";

export const sections: Section[] = [
  // ── ACCUEIL ───────────────────────────────────────────────────────────────
  {
    id: "accueil",
    label: "Accueil",
    tiles: [
      {
        id: "moi",
        title: "Nolan Lemaitre",
        subtitle: "Alternant ingénieur cloud",
        glyph: "home",
        detail: {
          stats: [
            { label: "Poste", value: "Alternant ingénieur cloud" },
            { label: "Entreprise", value: "Carrefour" },
            { label: "Où", value: "Massy (91)" },
          ],
          body: [
            "J'ai 19 ans et je suis alternant ingénieur cloud chez Carrefour, dans l'équipe OneCloud. Au quotidien je fais de l'infrastructure as code sur GCP et Azure, je migre les self-services de l'équipe vers Backstage, et je construis des automatisations qui tournent en production.",
            "En parallèle je prépare mon Bachelor à l'ESGI, spécialisation IA & Big Data, avec un Master Data/IA visé derrière. Et le reste du temps, je casse des trucs sur mon VPS.",
          ],
          rows: [
            { label: "Voir mes projets" },
            { label: "Voir mon parcours" },
            { label: "Me contacter" },
          ],
        },
      },
      {
        id: "carrefour",
        title: "Carrefour — OneCloud",
        subtitle: "Alternance en cours",
        glyph: "cloud",
        detail: {
          stats: [
            { label: "Rôle", value: "Ingénieur cloud" },
            { label: "Clouds", value: "GCP / Azure" },
            { label: "Équipe", value: "~24 personnes" },
          ],
          body: [
            "OneCloud est l'équipe qui fournit la plateforme cloud interne du groupe. Je travaille sur l'outillage que les équipes produit utilisent pour livrer.",
            "Concrètement : une quarantaine de self-services migrés de Jenkins vers Backstage, la refonte de l'architecture des sandbox cloud avec un provisioning en self-service via Terraform et GitLab CI, et une douzaine de workflows d'automatisation en production, la plupart avec un LLM dans la boucle.",
            "Je suis aussi responsable des mises en production des workflows de toute l'équipe automation.",
          ],
          rows: [],
        },
      },
      {
        id: "esgi",
        title: "ESGI",
        subtitle: "Bachelor Informatique",
        glyph: "school",
        detail: {
          stats: [
            { label: "Diplôme", value: "Bachelor Informatique" },
            { label: "Spécialité", value: "IA & Big Data" },
            { label: "Suite", value: "Master IA / Data" },
          ],
          body: [
            "Bachelor Informatique à l'ESGI de 2024 à 2027, en alternance avec Carrefour. Troisième année en spécialisation IABD — Intelligence Artificielle & Big Data.",
            "Objectif ensuite : un Master IA/Data. C'est là que mes projets perso et mon boulot se rejoignent — j'ai envie de faire de la donnée et du modèle, pas seulement de la plomberie autour.",
          ],
          rows: [],
        },
      },
    ],
  },

  // ── PROJETS ───────────────────────────────────────────────────────────────
  {
    id: "projets",
    label: "Projets",
    tiles: [
      {
        id: "portfolio",
        title: "Ce portfolio",
        subtitle: "Le dashboard NXE dans un navigateur",
        glyph: "picturelib",
        detail: {
          stats: [
            { label: "Type", value: "Projet perso" },
            { label: "Stack", value: "React, TypeScript, three.js" },
            { label: "Rôle", value: "Solo" },
          ],
          body: [
            "Le site sur lequel tu es : une reproduction du dashboard New Xbox Experience de la Xbox 360, celui de 2008. Tuiles en fuite, navigation à la manette ou au clavier, sons du dashboard, console 3D cliquable à l'entrée.",
            "Le critère de réussite n'était pas « ça fait vaguement Xbox » mais « quelqu'un qui a connu la console reconnaît le dashboard en deux secondes ». Les cotes des CSS viennent de mesures relevées sur des captures de référence, et une boucle de comparaison automatique capture le site puis le confronte aux références à chaque itération.",
          ],
          rows: [
            { label: "Code source", href: "https://github.com/Oxyfun/Portfolio-NXE" },
          ],
        },
      },
      {
        id: "orchestrateur",
        title: "Orchestrateur de serveurs",
        subtitle: "Un serveur de jeu en 5 minutes",
        glyph: "gamelib",
        detail: {
          stats: [
            { label: "Type", value: "Projet perso" },
            { label: "Stack", value: "Laravel, PHP, Docker" },
            { label: "Rôle", value: "Solo" },
          ],
          body: [
            "Une plateforme web qui automatise le déploiement et la configuration de serveurs pour six jeux : Minecraft, Counter-Strike, Satisfactory et compagnie.",
            "Monter un serveur à la main, c'est plusieurs heures de fichiers de config, de ports et de dépendances. Ici on choisit son jeu, la plateforme provisionne et configure tout : moins de cinq minutes.",
          ],
          // Dépôt privé : pas de lien.
          rows: [],
        },
      },
      {
        id: "upcycleconnect",
        title: "UpcycleConnect",
        subtitle: "Projet annuel ESGI",
        glyph: "terminal",
        detail: {
          stats: [
            { label: "Type", value: "Projet annuel ESGI" },
            { label: "Stack", value: "Go, Laravel, Android, pfSense" },
            { label: "Rôle", value: "Projet de groupe" },
          ],
          body: [
            "Un écosystème complet d'upcycling déployé sur six sites en France et en Suisse : API en Go, application Android, interface web.",
            "La partie la plus intéressante était en dessous : segmentation multi-VLAN, VPN inter-sites et cluster de firewalls pfSense pour relier les six sites, le tout conteneurisé, avec Stripe pour le paiement et OneSignal pour les notifications.",
          ],
          rows: [
            { label: "Code source", href: "https://github.com/Oxyfun/Projet-Annuel" },
          ],
        },
      },
      {
        id: "bilo",
        title: "The Binding of Bilo",
        subtitle: "Rogue-like 2D en C",
        glyph: "gamelib",
        detail: {
          stats: [
            { label: "Type", value: "Projet école" },
            { label: "Stack", value: "C, SDL2" },
            { label: "Rôle", value: "Projet de groupe" },
          ],
          body: [
            "Un rogue-like 2D écrit en C avec SDL2, inspiré de The Binding of Isaac. Génération procédurale du donjon, transitions entre salles, minimap, système de collision, IA de suivi pour les monstres, mini-boss, items et coffres qui modifient les stats.",
            "Il embarque aussi un éditeur de niveau intégré : on pose les tuiles, les portes, les monstres et les items à la souris, et la salle est sauvegardée en CSV pour être réinjectée dans la génération.",
          ],
          rows: [
            { label: "Code source", href: "https://github.com/Oxyfun/The-Binding-of-Bilo" },
          ],
        },
      },
      {
        id: "homelab",
        title: "Homelab VPS",
        subtitle: "n8n, Minecraft, et le reste",
        glyph: "server",
        detail: {
          stats: [
            { label: "Type", value: "Infra perso" },
            { label: "Hôte", value: "VPS OVH" },
            { label: "Services", value: "n8n, Minecraft" },
          ],
          body: [
            "Un homelab sur VPS où je fais tourner ce dont j'ai besoin : n8n pour mes automatisations perso, un serveur Minecraft, mes projets web et les services qui vont avec.",
            "Tout est en conteneurs derrière un reverse proxy. C'est là que je casse des choses avant de les proposer au boulot.",
          ],
          rows: [],
        },
      },
      {
        id: "letterboxd",
        title: "Random Letterboxd",
        subtitle: "Un film au hasard dans ta watchlist",
        glyph: "film",
        detail: {
          stats: [
            { label: "Type", value: "Projet perso" },
            { label: "Source", value: "Letterboxd" },
            { label: "Rôle", value: "Solo" },
          ],
          body: [
            "Un sélecteur aléatoire de films depuis une watchlist Letterboxd, hébergé sur mon VPS.",
            "Le problème n'a jamais été de trouver quoi regarder, mais de choisir. L'outil lit la watchlist et tranche à ma place.",
          ],
          /* L'URL publique n'a pas été fournie. Pour ajouter le bouton :
             rows: [{ label: 'Ouvrir', href: 'https://…' }] */
          rows: [],
        },
      },
    ],
  },

  // ── COMPÉTENCES ───────────────────────────────────────────────────────────
  {
    id: "competences",
    label: "Compétences",
    tiles: [
      {
        id: "cloud",
        title: "Cloud",
        subtitle: "GCP, Azure",
        glyph: "cloud",
        detail: {
          stats: [
            { label: "GCP", value: "Quotidien" },
            { label: "Azure", value: "Quotidien" },
            { label: "Contexte", value: "Multi-cloud" },
          ],
          body: [
            "Je provisionne et j'opère sur GCP et Azure en parallèle, dans un contexte multi-cloud assumé.",
            "Réseau, IAM, gestion des identités de service, quotas, coûts. La partie la moins visible et la plus structurante.",
          ],
          rows: [],
        },
      },
      {
        id: "iac",
        title: "Infra as code",
        subtitle: "Terraform, GitLab CI",
        glyph: "terminal",
        detail: {
          stats: [
            { label: "Terraform", value: "Modules" },
            { label: "CI", value: "GitLab CI" },
            { label: "Portée", value: "GCP + Azure" },
          ],
          body: [
            "Terraform pour tout ce qui se provisionne, en modules réutilisables plutôt qu'en copier-coller entre projets.",
            "GitLab CI pour l'appliquer, et Backstage comme porte d'entrée : les équipes créent un service depuis un template et repartent avec un dépôt, une pipeline et une infra déjà câblés.",
          ],
          rows: [],
        },
      },
      {
        id: "automatisation",
        title: "Automatisation & IA",
        subtitle: "n8n, LLM, MCP",
        glyph: "settings",
        detail: {
          stats: [
            { label: "n8n", value: "En production" },
            { label: "LLM", value: "Intégrés aux workflows" },
            { label: "MCP", value: "En cours" },
          ],
          body: [
            "Une douzaine de workflows n8n en production : synthèse automatique de tickets, notification de demandes, détection de modifications manuelles en console cloud, suivi des incidents et des fins de support. La majorité ont un LLM dans la boucle, pour résumer ou classer ce qu'un humain lisait à la main.",
            "En ce moment je travaille sur les serveurs MCP, pour exposer l'infrastructure cloud aux agents de façon sécurisée et réutilisable. Et je fais tourner des modèles en local sur ma machine, histoire de savoir ce que ça coûte vraiment.",
          ],
          rows: [],
        },
      },
      {
        id: "developpement",
        title: "Développement",
        subtitle: "Python, Go, Java, C",
        glyph: "keyboard",
        detail: {
          stats: [
            { label: "Backend", value: "Python, Go, Java, PHP" },
            { label: "Bas niveau", value: "C" },
            { label: "Web", value: "TypeScript, Laravel" },
          ],
          body: [
            "Python et Go pour l'outillage, Java et C pour l'école, PHP/Laravel et TypeScript pour le web, Kotlin pour l'Android.",
            "SQL et NoSQL des deux côtés, PostgreSQL surtout. Rien d'exotique : ce qui compte c'est de savoir choisir le bon outil et de livrer quelque chose de maintenable.",
          ],
          rows: [],
        },
      },
    ],
  },

  // ── PARCOURS ──────────────────────────────────────────────────────────────
  {
    id: "parcours",
    label: "Parcours",
    tiles: [
      {
        id: "carrefour-parcours",
        title: "Carrefour",
        subtitle: "Nov. 2024 → sept. 2027",
        glyph: "cloud",
        detail: {
          heading: "CARREFOUR — SIÈGE SOCIAL, MASSY",
          stats: [
            { label: "Poste", value: "Ingénieur cloud (alternance)" },
            { label: "Période", value: "Nov. 2024 → sept. 2027" },
            { label: "Équipe", value: "OneCloud" },
          ],
          body: [
            "Alternance en cours au siège de Massy, dans l'équipe OneCloud. Infrastructure as code, CI/CD, plateforme interne et automatisation.",
            "Je travaille en grande autonomie sur mes sujets : cadrage, tickets, développement, documentation, puis démo à l'équipe à chaque fin de projet.",
          ],
          rows: [],
        },
      },
      {
        id: "esgi-parcours",
        title: "ESGI Paris",
        subtitle: "2024 → 2027",
        glyph: "school",
        detail: {
          heading: "ESGI PARIS — BACHELOR INFORMATIQUE",
          stats: [
            { label: "Diplôme", value: "Bachelor Informatique" },
            { label: "Période", value: "2024 → 2027" },
            { label: "Spécialité", value: "IA & Big Data" },
          ],
          body: [
            "Développement : Java, Laravel, C avancé, Kotlin, Git, UML2. Systèmes et réseaux : Linux, Windows, virtualisation, sécurité. Web : PHP, JavaScript, API, Go, cloud, SQL et NoSQL.",
            "Et la partie qui m'intéresse le plus : data mining, algorithmique avancée et initiation à l'IA, avant la spécialisation IABD en troisième année.",
          ],
          rows: [],
        },
      },
      {
        id: "massy",
        title: "Mairie de Massy",
        subtitle: "Étés 2023 et 2024",
        glyph: "home",
        detail: {
          stats: [
            { label: "Été 2024", value: "Logistique" },
            { label: "Été 2023", value: "Factotum" },
            { label: "Type", value: "Emplois saisonniers" },
          ],
          body: [
            "Deux étés en emploi saisonnier à la mairie de ma ville, en logistique puis en factotum.",
            "Rien à voir avec l'informatique, mais c'est là que j'ai appris à me lever tôt et à finir ce que je commence.",
          ],
          rows: [],
        },
      },
      {
        id: "bac",
        title: "Bac Général",
        subtitle: "Maths, NSI, SES",
        glyph: "school",
        detail: {
          heading: "LYCÉE FUSTEL DE COULANGES",
          stats: [
            { label: "Diplôme", value: "Baccalauréat Général" },
            { label: "Période", value: "2021 → 2024" },
            { label: "Spécialités", value: "Maths, NSI, SES" },
          ],
          body: [
            "Bac général au lycée Fustel de Coulanges à Massy, spécialités mathématiques, NSI et SES.",
            "La NSI a réglé la question de l'orientation assez vite.",
          ],
          rows: [],
        },
      },
      {
        id: "ensuite",
        title: "Ensuite",
        subtitle: "Master IA / Data",
        glyph: "school",
        detail: {
          stats: [
            { label: "Cible", value: "Master" },
            { label: "Domaine", value: "IA / Data" },
            { label: "Statut", value: "Visé" },
          ],
          body: [
            "Un Master IA/Data après le Bachelor.",
            "J'ai commencé par l'infra et j'y suis à l'aise. Ce que je veux ajouter, c'est le traitement de la donnée et les modèles — la partie que mes projets perso grattent déjà sans que j'aie toute la théorie derrière.",
          ],
          rows: [],
        },
      },
    ],
  },

  // ── CONTACT ───────────────────────────────────────────────────────────────
  {
    id: "contact",
    label: "Contact",
    tiles: [
      {
        id: "contact",
        title: "Me contacter",
        subtitle: "Email, téléphone, LinkedIn, GitHub",
        glyph: "mail",
        detail: {
          stats: [
            { label: "Où", value: "Massy (91), Île-de-France" },
            { label: "Langues", value: "FR / EN (B2) / 中文 (HSK3)" },
            { label: "Réponse", value: "Sous 48 h" },
          ],
          body: [
            "Le plus simple, c'est l'email. LinkedIn marche aussi, et le téléphone si c'est urgent.",
            "Mon CV est téléchargeable ci-dessous.",
          ],
          rows: [
            {
              label: "Email — nolanlemaitre91@gmail.com",
              href: "mailto:nolanlemaitre91@gmail.com",
            },
            { label: "Téléphone — 06 62 18 63 01", href: "tel:+33662186301" },
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/in/nolan-lemaitre-b79a69332/",
            },
            { label: "GitHub", href: "https://github.com/Oxyfun" },
            // Dépose le fichier dans public/assets/ pour que ce lien fonctionne.
            { label: "Télécharger mon CV", href: "/assets/CV_Nolan_Lemaitre.pdf" },
          ],
        },
      },
    ],
  },
];
