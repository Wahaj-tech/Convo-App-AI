// Shared app palette. The app uses a LIGHT cream canvas with an ORANGE accent.
// Semantic key names are kept (incl. the legacy `teal`/`tealDim` names) so every
// component that imports `C` flips automatically — change values here, not usages.
export const C = {
  deep: "#f1f0ec", // canvas / chat background (cream)
  panel: "#ffffff", // side nav, headers, cards
  panelAlt: "#f5f3ee", // inputs, incoming / AI bubbles
  active: "#ece9e2", // selected / hovered surface (warm gray)
  border: "#e3e0d8", // borders & dividers
  teal: "#ea580c", // PRIMARY ACCENT — orange (name kept for compatibility)
  tealDim: "rgba(234,88,12,0.12)", // orange tint (avatars / washes)
  onAccent: "#ffffff", // text / icons on the orange accent
  text: "#141414", // primary text (ink)
  muted: "#6b6b6b", // secondary text
  userBubble: "#ffe2cf", // outgoing message bubble (light orange)
};
