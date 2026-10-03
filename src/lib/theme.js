// Shared colours for the redesigned flows. The wizard cycles through these
// four, step by step, so every screen feels related but never flat.
export const COLORS = {
  teal: "#1F6F5C",
  coral: "#D0584B",
  steel: "#3F5F8F",
  sage: "#789A8B",
};

export const STEP_COLORS = [COLORS.teal, COLORS.coral, COLORS.steel, COLORS.sage];

// Small text needs more contrast than a chip or a border does, so the two
// lighter colours get a deeper shade whenever they are used for words.
const TEXT_SHADE = { [COLORS.coral]: "#B94A3D", [COLORS.sage]: "#55796A" };
export const textShade = (color) => TEXT_SHADE[color] || color;
