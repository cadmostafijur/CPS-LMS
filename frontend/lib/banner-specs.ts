export const BANNER_IMAGE_SPECS = {
  HERO: {
    label: "Hero slide (homepage carousel)",
    size: "1920 × 720 px",
    ratio: "8:3 (wide)",
    maxUpload: "2.5 MB",
    tips: "Add multiple hero banners — they auto-slide. Leave text off for image-only slides.",
  },
  STRIP: {
    label: "Promo strip (below hero / catalog)",
    size: "1200 × 400 px",
    ratio: "3:1 (wide)",
    maxUpload: "1.5 MB",
    tips: "Works best as a wide graphic with space on the left for title text.",
  },
  STORY: {
    label: "Success story (learner spotlight)",
    size: "400 × 400 px",
    ratio: "1:1 (square portrait)",
    maxUpload: "1.5 MB",
    tips: "Use a clear face photo. Title = name, subtitle = their quote.",
  },
} as const;
