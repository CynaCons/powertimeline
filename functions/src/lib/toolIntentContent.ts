/**
 * Sprint 1 tool-intent marketing pages.
 * Copy follows docs/tool-intent-pages.md. FAQ slots that need product
 * confirmation stay explicit TODO placeholders — do not invent claims.
 */

export const DEMO_TIMELINE_URLS = {
  iphone: "https://powertimeline.com/cynacons/timeline/iphone-milestones",
  react: "https://powertimeline.com/cynacons/timeline/react-versions",
  wc2022: "https://powertimeline.com/cynacons/timeline/world-cup-2022",
} as const;

export const CREATE_TIMELINE_PATH = "/browse?create=1";
export const GITHUB_REPO_URL = "https://github.com/CynaCons/powertimeline";
export const EMBED_EXAMPLE_URL =
  "https://powertimeline.com/cynacons/timeline/react-versions/embed";

export const TOOL_INTENT_SLUGS = [
  "timeline-maker",
  "timelinejs-alternative",
  "frise-chronologique",
] as const;

export type ToolIntentSlug = (typeof TOOL_INTENT_SLUGS)[number];

export interface ToolIntentFaq {
  question: string;
  answer: string;
  /** Product-truth slot still awaiting Eng confirmation. */
  todo?: boolean;
}

export interface ToolIntentCompare {
  caption: string;
  headers: [string, string, string];
  rows: [string, string, string][];
}

export interface ToolIntentPageDefinition {
  slug: ToolIntentSlug;
  lang: "en" | "fr";
  title: string;
  metaDescription: string;
  h1: string;
  lead: string;
  bestForTitle: string;
  bestFor: string[];
  notForTitle: string;
  notFor: string[];
  stepsTitle?: string;
  steps?: string[];
  compare?: ToolIntentCompare;
  whenKeep?: { title: string; body: string };
  whenSwitch?: { title: string; body: string };
  proofLabel: string;
  proofHref: string;
  proofTitle: string;
  proofNote: string;
  createCta: string;
  forkCta: string;
  faqs: ToolIntentFaq[];
  internalLinks: { href: string; label: string }[];
}

export const TOOL_INTENT_PAGES: Record<
  ToolIntentSlug,
  ToolIntentPageDefinition
> = {
  "timeline-maker": {
    slug: "timeline-maker",
    lang: "en",
    title:
      "Free Timeline Maker for Shareable, Explorable Timelines | PowerTimeline",
    metaDescription:
      "Make a free online timeline you can zoom, share, and collaborate on — not just export a PNG. Start from a demo or create yours on PowerTimeline.",
    h1: "Free timeline maker for timelines people can explore",
    lead: 'Most “timeline makers” spit out a static image. PowerTimeline is for timelines you publish, zoom, cite, and improve — like a repo for events.',
    bestForTitle: "Best for",
    bestFor: [
      "History, journalism, research, product/tech narratives",
      "Dense event sets (dozens to hundreds)",
      "Sharing a link others can explore",
    ],
    notForTitle: "Not for",
    notFor: [
      "One-off slide PNGs with no need to update",
      "Print-only classroom worksheets (point to FriseChronos-style tools honestly)",
    ],
    stepsTitle: "How it works",
    steps: [
      "Start blank or fork a public demo",
      "Add events (dates, sources, media)",
      "Share a link — readers zoom and browse Stream View on mobile",
    ],
    proofLabel: "Proof",
    proofHref: DEMO_TIMELINE_URLS.iphone,
    proofTitle: "iPhone Milestones (2007–2024)",
    proofNote:
      "A dense product/tech chronology — the kind of living timeline a static PNG cannot stay honest about.",
    createCta: "Create free timeline",
    forkCta: "Fork demo",
    faqs: [
      {
        question: "Is PowerTimeline free?",
        answer:
          "Yes. You can start free: create a public timeline or fork a demo. No paid pitch on this page.",
      },
      {
        question: "Do I need an account?",
        answer:
          "TODO: product truth — auth. Confirm whether create/edit requires sign-in before publishing this answer.",
        todo: true,
      },
      {
        question: "Can I export?",
        answer:
          "TODO: product truth — export. State current capability only; do not promise paid export or formats that are not shipped.",
        todo: true,
      },
      {
        question: "Timeline maker vs spreadsheet?",
        answer:
          "A spreadsheet stores rows. PowerTimeline is exploration plus citations plus a share URL others can zoom and browse.",
      },
      {
        question: "How is this different from Visme/Canva?",
        answer:
          "Those tools make graphics. PowerTimeline is a living, shareable timeline — GitHub for events, not a static poster.",
      },
    ],
    internalLinks: [
      { href: "/timelinejs-alternative", label: "TimelineJS alternative" },
      { href: "/frise-chronologique", label: "Frise chronologique" },
      { href: EMBED_EXAMPLE_URL, label: "Embed a timeline" },
    ],
  },
  "timelinejs-alternative": {
    slug: "timelinejs-alternative",
    lang: "en",
    title:
      "TimelineJS Alternative for Dense, Collaborative Timelines | PowerTimeline",
    metaDescription:
      "Looking for a TimelineJS alternative? PowerTimeline handles denser event sets, adaptive zoom, citations, and shareable public timelines — free to start.",
    h1: "A TimelineJS alternative built for denser, living timelines",
    lead: "TimelineJS is great for narrative slideshows from a spreadsheet. PowerTimeline is for dense, zoomable timelines you can treat like a shared workspace.",
    bestForTitle: "Best for",
    bestFor: [
      "Dense chronologies that keep growing",
      "Product and tech histories that need citations",
      "Public share links with zoom, minimap, and Stream View",
    ],
    notForTitle: "Not for",
    notFor: [
      "Classroom slideshows where a Google Sheet → TimelineJS story is already enough",
      "Article scrollytelling that wants TimelineJS’s slide choreography",
    ],
    compare: {
      caption: "TimelineJS vs PowerTimeline",
      headers: ["", "TimelineJS", "PowerTimeline"],
      rows: [
        ["Authoring", "Google Sheet → publish", "In-app editor + YAML"],
        ["Density", "Best ~dozens", "Hundreds + degradation"],
        ["Interaction", "Story slides", "Zoom, minimap, Stream View"],
        [
          "Collab model",
          "Sheet sharing",
          "Fork / public share (GitHub-for-timelines)",
        ],
        ["Self-host story", "Strong (open lib)", "Hosted product (+ OSS repo)"],
      ],
    },
    whenKeep: {
      title: "When to keep TimelineJS",
      body: "Classroom slideshows, simple sheet workflows, embed-in-article scrolly.",
    },
    whenSwitch: {
      title: "When to switch",
      body: "Dense chronologies, ongoing updates, product/tech histories, citation-heavy research.",
    },
    proofLabel: "Proof",
    proofHref: DEMO_TIMELINE_URLS.react,
    proofTitle: "React Version History",
    proofNote:
      "This is painful as a slideshow. A dense version history needs zoom, not one slide per release.",
    createCta: "Create timeline",
    forkCta: "Fork the React demo",
    faqs: [
      {
        question: "Can I import from a spreadsheet/YAML?",
        answer:
          "YAML import and export are supported today. Google Sheet import is not available yet.",
      },
      {
        question: "Is there an embed?",
        answer:
          "TODO: product truth — embed. Link docs/embed when the published answer is confirmed.",
        todo: true,
      },
      {
        question: "Open source?",
        answer: `Yes. The product is hosted, and the repository is public at ${GITHUB_REPO_URL}.`,
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes. Readers can browse Stream View on mobile instead of pinching a desktop canvas.",
      },
    ],
    internalLinks: [
      { href: "/timeline-maker", label: "Timeline maker" },
      { href: "/frise-chronologique", label: "Frise chronologique" },
      { href: GITHUB_REPO_URL, label: "GitHub" },
    ],
  },
  "frise-chronologique": {
    slug: "frise-chronologique",
    lang: "fr",
    title:
      "Frise chronologique en ligne, partageable et explorables | PowerTimeline",
    metaDescription:
      "Créez une frise chronologique en ligne à zoomer, citer et partager — pas seulement un export PDF. Démos gratuites sur PowerTimeline.",
    h1: "Frise chronologique en ligne — à explorer, pas seulement à imprimer",
    lead: "FriseChronos et outils scolaires excellent pour l’export PDF/image. PowerTimeline sert les frises vivantes : lien partageable, zoom, sources, collaboration légère.",
    bestForTitle: "Idéal pour",
    bestFor: [
      "Histoire / journalisme / recherche",
      "Récits produit & tech",
      "Frises denses mises à jour dans le temps",
    ],
    notForTitle: "Moins adapté pour",
    notFor: [
      "Fiche à imprimer A4 pour demain matin (rester transparent ; FriseChronos gagne ce cas)",
    ],
    stepsTitle: "3 étapes",
    steps: [
      "Partir d’une démo publique ou créer",
      "Ajouter événements + sources",
      "Partager le lien (lecture mobile via Stream View)",
    ],
    proofLabel: "Preuve",
    proofHref: DEMO_TIMELINE_URLS.wc2022,
    proofTitle: "Coupe du monde 2022 — parcours vers la finale",
    proofNote:
      "Une chronologie sportive dense à zoomer — pas une affiche officielle, pas un export figé.",
    createCta: "Créer une frise gratuite",
    forkCta: "Fork une démo",
    faqs: [
      {
        question: "C’est gratuit ?",
        answer:
          "Oui. Vous pouvez créer une frise publique ou forker une démo, sans offre payante ici.",
      },
      {
        question: "Compte obligatoire ?",
        answer:
          "TODO: product truth — auth. Confirmer si la création / l’édition exige une connexion avant de publier cette réponse.",
        todo: true,
      },
      {
        question: "Export PDF ?",
        answer:
          "TODO: product truth — pdf. Ne pas inventer de capacité d’export ; confirmer la vérité produit.",
        todo: true,
      },
      {
        question: "Différence avec FriseChronos ?",
        answer:
          "FriseChronos gagne le cas impression A4 / PDF pour demain matin. PowerTimeline sert les frises vivantes : lien partageable, zoom, sources, mises à jour.",
      },
      {
        question: "Alternative à TimelineJS ?",
        answer:
          "Oui — voir la page TimelineJS alternative pour un comparatif honnête (densité, zoom, collaboration).",
      },
    ],
    internalLinks: [
      { href: "/timeline-maker", label: "Timeline maker" },
      { href: "/timelinejs-alternative", label: "TimelineJS alternative" },
      { href: DEMO_TIMELINE_URLS.iphone, label: "Démo iPhone" },
      { href: DEMO_TIMELINE_URLS.wc2022, label: "Démo Coupe du monde 2022" },
    ],
  },
};

export function isToolIntentSlug(value: string): value is ToolIntentSlug {
  return (TOOL_INTENT_SLUGS as readonly string[]).includes(value);
}

export function getToolIntentPage(
  slug: string
): ToolIntentPageDefinition | null {
  return isToolIntentSlug(slug) ? TOOL_INTENT_PAGES[slug] : null;
}
