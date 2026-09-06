const COLOR_PALETTE = [
  {
    bg: "bg-sea-500/20",
    ring: "ring-sea-500/40",
    text: "text-sea-300",
    gradient: "from-sea-600/30 to-sea-400/10",
  },
  {
    bg: "bg-fawn-500/20",
    ring: "ring-fawn-500/40",
    text: "text-fawn-300",
    gradient: "from-fawn-600/30 to-fawn-400/10",
  },
  {
    bg: "bg-pine-500/20",
    ring: "ring-pine-500/40",
    text: "text-pine-300",
    gradient: "from-pine-600/30 to-pine-400/10",
  },
  {
    bg: "bg-sage-500/20",
    ring: "ring-sage-500/40",
    text: "text-sage-300",
    gradient: "from-sage-600/30 to-sage-400/10",
  },
  {
    bg: "bg-rose-500/20",
    ring: "ring-rose-500/40",
    text: "text-rose-300",
    gradient: "from-rose-600/30 to-rose-400/10",
  },
  {
    bg: "bg-indigo-500/20",
    ring: "ring-indigo-500/40",
    text: "text-indigo-300",
    gradient: "from-indigo-600/30 to-indigo-400/10",
  },
] as const;

export type PersonColorSet = (typeof COLOR_PALETTE)[number];

const BASE_PERSON_COLORS: Record<string, PersonColorSet> = {
  don: COLOR_PALETTE[0],
  bijo: COLOR_PALETTE[1],
  suraj: COLOR_PALETTE[2],
  adithyan: COLOR_PALETTE[3],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Fallback dictionary with Proxy support for dynamically added people */
export const PERSON_COLORS: Record<string, PersonColorSet> = new Proxy(
  BASE_PERSON_COLORS,
  {
    get(target, prop: string | symbol) {
      if (typeof prop === "string") {
        if (prop in target) return target[prop];
        const idx = hashString(prop) % COLOR_PALETTE.length;
        return COLOR_PALETTE[idx];
      }
      return Reflect.get(target, prop);
    },
  },
);

export function getPersonColors(
  personId: string,
  personIds: readonly string[],
): PersonColorSet {
  const index = personIds.indexOf(personId);
  return COLOR_PALETTE[(index >= 0 ? index : 0) % COLOR_PALETTE.length];
}
