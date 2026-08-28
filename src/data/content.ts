/**
 * ============================================================================
 *  TOUT LE CONTENU DU SITE EST DANS CE FICHIER.
 *  Tu peux l'éditer sans toucher au reste du projet.
 *  Voir README.md § « Éditer le contenu ».
 * ============================================================================
 */

/** Glyphes disponibles. Les cinq premiers sont les icônes NXE d'origine. */
export type GlyphId =
  | "picturelib"
  | "gamelib"
  | "settings"
  // glyphes dessinés en SVG dans le même langage visuel
  | "home"
  | "cloud"
  | "terminal"
  | "school"
  | "mail"
  | "server"
  | "keyboard"
  | "film"
  // ajoutés pour que deux cartes voisines n'aient jamais la même icône
  | "network"
  | "heart"
  | "book"
  | "target"
  | "calendar"
  | "building"
  | "phone"
  | "badge"
  | "document";

/** Une ligne du panneau de détail. */
export interface DetailRow {
  label: string;
  /** Si présent, la ligne devient un lien (s'ouvre dans un nouvel onglet). */
  href?: string;
  /**
   * Si présent, la ligne ferme la lame et va à cette section (son `id`).
   * Sans `href` ni `section`, une ligne ne fait rien du tout - c'était le cas
   * des trois lignes de la carte d'accueil.
   */
  section?: string;
}

/**
 * Une barre de progression du panneau de détail.
 *
 * Relevé sur image10 (« Gamerscore 25/105 », « Achievements 1/4 ») : libellé à
 * gauche, pilule très sombre, remplissage vert PROPORTIONNEL à la valeur -
 * 22 % de la piste pour 25/105, 25 % pour 1/4 - et le chiffre centré dedans.
 */
export interface DetailBar {
  label: string;
  /** Ce qui s'affiche dans la pilule, ex. « 21 / 34 mois ». */
  value: string;
  /** Remplissage, de 0 à 1. */
  ratio: number;
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
    /** Optionnel : barres de progression, au-dessus du corps de texte. */
    bars?: DetailBar[];
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
            { label: "Voir mes projets", section: "projets" },
            { label: "Voir mon parcours", section: "parcours" },
            { label: "Me contacter", section: "contact" },
          ],
        },
      },
      {
        id: "carrefour",
        title: "Carrefour, OneCloud",
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
          rows: [
            { label: "Ce que j'y fais", section: "competences" },
            { label: "Mon parcours", section: "parcours" },
          ],
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
            "Bachelor Informatique à l'ESGI de 2024 à 2027, en alternance avec Carrefour. Troisième année en spécialisation IABD (Intelligence Artificielle & Big Data).",
            "Objectif ensuite : un Master IA/Data. C'est là que mes projets perso et mon boulot se rejoignent : j'ai envie de faire de la donnée et du modèle, pas seulement de la plomberie autour.",
          ],
          rows: [
            { label: "Mes projets", section: "projets" },
            { label: "Mon parcours", section: "parcours" },
          ],
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
            {
              label: "Code source",
              href: "https://github.com/Oxyfun/Portfolio-NXE",
            },
            { label: "Ce que ça m'a appris", section: "competences" },
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
          rows: [
            { label: "Mes compétences", section: "competences" },
            { label: "Ce que ça m'a appris", section: "competences" },
          ],
        },
      },
      {
        id: "upcycleconnect",
        title: "UpcycleConnect",
        subtitle: "Projet annuel ESGI",
        glyph: "network",
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
            {
              label: "Code source",
              href: "https://github.com/Oxyfun/Projet-Annuel",
            },
            { label: "Ce que ça m'a appris", section: "competences" },
          ],
        },
      },
      {
        id: "bilo",
        title: "The Binding of Bilo",
        subtitle: "Rogue-like 2D en C",
        glyph: "heart",
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
            {
              label: "Code source",
              href: "https://github.com/Oxyfun/The-Binding-of-Bilo",
            },
            { label: "Ce que ça m'a appris", section: "competences" },
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
          rows: [
            { label: "Mes compétences", section: "competences" },
            { label: "Ce que ça m'a appris", section: "competences" },
          ],
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
          rows: [
            { label: "Ouvrir", href: "https://letterboxd.myddns.me/" },
            { label: "Ce que ça m'a appris", section: "competences" },
          ],
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
          rows: [
            { label: "Où je pratique ça", section: "parcours" },
            { label: "Les projets qui s'en servent", section: "projets" },
          ],
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
          rows: [
            { label: "Les projets qui s'en servent", section: "projets" },
            { label: "Mon GitHub", href: "https://github.com/Oxyfun" },
          ],
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
          rows: [
            { label: "Les projets qui s'en servent", section: "projets" },
            { label: "Mon GitHub", href: "https://github.com/Oxyfun" },
          ],
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
          rows: [
            { label: "Les projets qui s'en servent", section: "projets" },
            { label: "Mon GitHub", href: "https://github.com/Oxyfun" },
          ],
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
        glyph: "building",
        detail: {
          heading: "Carrefour, siège social de Massy",
          stats: [
            { label: "Poste", value: "Ingénieur cloud (alternance)" },
            { label: "Période", value: "Nov. 2024 → sept. 2027" },
            { label: "Équipe", value: "OneCloud" },
          ],
          /* Avancement factuel, calculé sur les dates ci-dessus - rien
             d'auto-évalué ici. À réajuster quand les dates bougent. */
          bars: [{ label: "Avancement", value: "21 / 34 mois", ratio: 0.62 }],
          body: [
            "Alternance en cours au siège de Massy, dans l'équipe OneCloud. Infrastructure as code, CI/CD, plateforme interne et automatisation.",
            "Je travaille en grande autonomie sur mes sujets : cadrage, tickets, développement, documentation, puis démo à l'équipe à chaque fin de projet.",
          ],
          rows: [
            { label: "Ce que j'y fais", section: "competences" },
            { label: "Me contacter", section: "contact" },
          ],
        },
      },
      {
        id: "esgi-parcours",
        title: "ESGI Paris",
        subtitle: "2024 → 2027",
        glyph: "school",
        detail: {
          heading: "ESGI Paris, Bachelor Informatique",
          stats: [
            { label: "Diplôme", value: "Bachelor Informatique" },
            { label: "Période", value: "2024 → 2027" },
            { label: "Spécialité", value: "IA & Big Data" },
          ],
          bars: [{ label: "Avancement", value: "23 / 36 mois", ratio: 0.64 }],
          body: [
            "Développement : Java, Laravel, C avancé, Kotlin, Git, UML2. Systèmes et réseaux : Linux, Windows, virtualisation, sécurité. Web : PHP, JavaScript, API, Go, cloud, SQL et NoSQL.",
            "Et la partie qui m'intéresse le plus : data mining, algorithmique avancée et initiation à l'IA, avant la spécialisation IABD en troisième année.",
          ],
          rows: [
            { label: "Mes projets d'école", section: "projets" },
            { label: "Mes compétences", section: "competences" },
          ],
        },
      },
      {
        id: "massy",
        title: "Mairie de Massy",
        subtitle: "Étés 2023 et 2024",
        glyph: "calendar",
        detail: {
          /* Trois cartes du Parcours ont un heading en capitales et deux non :
             le bandeau orange alternait entre crier et parler normalement dans
             la même section. Uniformisé - seule la casse change. */
          heading: "Mairie de Massy",
          stats: [
            { label: "Été 2024", value: "Logistique" },
            { label: "Été 2023", value: "Factotum" },
            { label: "Type", value: "Emplois saisonniers" },
          ],
          bars: [{ label: "Avancement", value: "Terminé", ratio: 1 }],
          body: [
            "Deux étés en emploi saisonnier à la mairie de ma ville, en logistique puis en factotum.",
            "Rien à voir avec l'informatique, mais c'est là que j'ai appris à me lever tôt et à finir ce que je commence.",
          ],
          rows: [
            { label: "La suite du parcours", section: "competences" },
            { label: "Me contacter", section: "contact" },
          ],
        },
      },
      {
        id: "bac",
        title: "Bac Général",
        subtitle: "Maths, NSI, SES",
        glyph: "book",
        detail: {
          heading: "Lycée Fustel de Coulanges",
          stats: [
            { label: "Diplôme", value: "Baccalauréat Général" },
            { label: "Période", value: "2021 → 2024" },
            { label: "Spécialités", value: "Maths, NSI, SES" },
          ],
          bars: [{ label: "Avancement", value: "Obtenu", ratio: 1 }],
          body: [
            "Bac général au lycée Fustel de Coulanges à Massy, spécialités mathématiques, NSI et SES.",
            "La NSI a réglé la question de l'orientation assez vite.",
          ],
          rows: [
            { label: "La suite du parcours", section: "competences" },
            { label: "Mes projets", section: "projets" },
          ],
        },
      },
      {
        id: "ensuite",
        title: "Ensuite",
        subtitle: "Master IA / Data",
        glyph: "target",
        detail: {
          heading: "Ensuite",
          stats: [
            { label: "Cible", value: "Master" },
            { label: "Domaine", value: "IA / Data" },
            { label: "Statut", value: "Visé" },
          ],
          bars: [{ label: "Avancement", value: "À venir", ratio: 0 }],
          body: [
            "Un Master IA/Data après le Bachelor.",
            "J'ai commencé par l'infra et j'y suis à l'aise. Ce que je veux ajouter, c'est le traitement de la donnée et les modèles. C'est la partie que mes projets perso grattent déjà sans que j'aie toute la théorie derrière.",
          ],
          rows: [
            { label: "Me contacter", section: "contact" },
            { label: "Mon CV", href: "/assets/CV_Nolan_Lemaitre.pdf" },
          ],
        },
      },
    ],
  },

  // ── CONTACT ───────────────────────────────────────────────────────────────
  /* Une carte par canal plutôt qu'une seule carte fourre-tout : la rangée du
     NXE est faite pour aligner des destinations, et une section à une seule
     tuile laissait les trois quarts de l'écran vides.
     Les textes sont courts et repris de ce que Nolan a écrit - à relire. */
  {
    id: "contact",
    label: "Contact",
    tiles: [
      {
        id: "email",
        title: "Email",
        subtitle: "nolanlemaitre91@gmail.com",
        glyph: "mail",
        detail: {
          stats: [
            { label: "Réponse", value: "Sous 48 h" },
            { label: "Où", value: "Massy (91), Île-de-France" },
            { label: "Langues", value: "FR / EN (B2) / 中文 (HSK3)" },
          ],
          body: [
            "Le plus simple, c'est l'email. Je réponds sous 48 heures.",
            "Pour une alternance, un stage ou juste une question sur un projet, n'hésite pas.",
          ],
          rows: [
            {
              label: "Écrire un mail",
              href: "mailto:nolanlemaitre91@gmail.com",
            },
            {
              label: "Télécharger mon CV",
              href: "/assets/CV_Nolan_Lemaitre.pdf",
            },
          ],
        },
      },
      {
        id: "telephone",
        title: "Téléphone",
        subtitle: "06 62 18 63 01",
        glyph: "phone",
        detail: {
          stats: [
            { label: "Numéro", value: "06 62 18 63 01" },
            { label: "Quand", value: "Si c'est urgent" },
            { label: "Où", value: "Massy (91)" },
          ],
          body: ["Le téléphone si c'est urgent. Sinon l'email passe mieux."],
          rows: [
            { label: "Appeler", href: "tel:+33662186301" },
            {
              label: "Ou m'écrire un mail",
              href: "mailto:nolanlemaitre91@gmail.com",
            },
          ],
        },
      },
      {
        id: "linkedin",
        title: "LinkedIn",
        subtitle: "Le parcours en détail",
        glyph: "badge",
        detail: {
          stats: [
            { label: "Réseau", value: "LinkedIn" },
            { label: "Poste", value: "Alternant ingénieur cloud" },
            { label: "Entreprise", value: "Carrefour" },
          ],
          body: [
            "Le parcours complet, les expériences et les recommandations.",
          ],
          rows: [
            {
              label: "Voir le profil",
              href: "https://www.linkedin.com/in/nolan-lemaitre-b79a69332/",
            },
            { label: "Mon GitHub", href: "https://github.com/Oxyfun" },
          ],
        },
      },
      {
        id: "github",
        title: "GitHub",
        subtitle: "Le code des projets",
        glyph: "terminal",
        detail: {
          stats: [
            { label: "Compte", value: "Oxyfun" },
            { label: "Publics", value: "Portfolio, UpcycleConnect, Bilo" },
            { label: "Reste", value: "Dépôts privés" },
          ],
          body: [
            "Le code des projets qui sont publics. Le reste est en privé, mais je peux en parler.",
          ],
          rows: [
            { label: "Voir le compte", href: "https://github.com/Oxyfun" },
            {
              label: "Mon LinkedIn",
              href: "https://www.linkedin.com/in/nolan-lemaitre-b79a69332/",
            },
          ],
        },
      },
      {
        id: "cv",
        title: "Mon CV",
        subtitle: "PDF, une page",
        glyph: "document",
        detail: {
          stats: [
            { label: "Format", value: "PDF" },
            { label: "Profil", value: "Ingénieur cloud" },
            { label: "Recherche", value: "Master IA / Data" },
          ],
          body: ["Le parcours, les compétences et les projets sur une page."],
          rows: [
            {
              label: "Télécharger mon CV",
              href: "/assets/CV_Nolan_Lemaitre.pdf",
            },
            {
              label: "M'écrire un mail",
              href: "mailto:nolanlemaitre91@gmail.com",
            },
          ],
        },
      },
    ],
  },
];
