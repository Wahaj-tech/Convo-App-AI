// Avatar helpers kept in a plain module so ui.jsx only exports components
// (satisfies the react-refresh/only-export-components lint rule).

const AVATAR_COLORS = ["#3b6e63", "#4a5a6a", "#5a4a6a", "#6a5a4a", "#4a6a5a", "#6a4a5a"];

// Pleasant deterministic background per name.
export function colorFor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
