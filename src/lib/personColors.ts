import type { PersonId } from "@/lib/types";

export const PERSON_COLORS: Record<
  PersonId,
  { bg: string; ring: string; text: string; gradient: string }
> = {
  don: {
    bg: "bg-sea-500/20",
    ring: "ring-sea-500/40",
    text: "text-sea-300",
    gradient: "from-sea-600/30 to-sea-400/10",
  },
  bijo: {
    bg: "bg-fawn-500/20",
    ring: "ring-fawn-500/40",
    text: "text-fawn-300",
    gradient: "from-fawn-600/30 to-fawn-400/10",
  },
  suraj: {
    bg: "bg-pine-500/20",
    ring: "ring-pine-500/40",
    text: "text-pine-300",
    gradient: "from-pine-600/30 to-pine-400/10",
  },
  adithyan: {
    bg: "bg-sage-500/20",
    ring: "ring-sage-500/40",
    text: "text-sage-300",
    gradient: "from-sage-600/30 to-sage-400/10",
  },
};
