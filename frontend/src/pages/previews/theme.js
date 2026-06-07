// Shared palette for the Figma "Deep Dark" designs (WhatsApp-style deep-dark teal).
// Pulled directly from the Figma file (fileKey ZZF1NTOIJ0ZIWDyhWeu65R).
export const C = {
  deep: "#0b141a", // app / chat background
  panel: "#111b21", // side nav + cards
  panelAlt: "#202c33", // search input + AI bubble
  active: "#2a3942", // active/selected row
  border: "#222d34",
  teal: "#00a884", // primary accent
  tealDim: "rgba(0,168,132,0.1)", // teal tint (avatars/overlays)
  text: "#e9edef", // primary text
  muted: "#8696a0", // secondary text
  userBubble: "#005c4b", // outgoing message bubble
};

// Monochrome variant (the two "- Monochrome" frames) — values from Figma.
export const MONO = {
  bg: "#0e141c",
  bubble: "#1b232d", // user bubble
  bubbleBorder: "#26303b",
  codeBg: "#0b0f14",
  codeBorder: "#44474a",
  border: "#44474a",
  text: "#dde3ee",
  muted: "#c4c7ca",
  // per-persona accent colors used for AI bubbles
  cyan: "#22b8cf",
  amber: "#d9a406",
};
