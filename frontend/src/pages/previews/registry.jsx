// Central registry of all Figma design previews.
// Each new design gets an entry here; the index page and the /preview/:slug
// route are driven entirely by this list.
import ChatHubPage from "../ChatHubPage";
import Conversations from "./Conversations";
import ChatWithAi from "./ChatWithAi";
import AiPersonas from "./AiPersonas";
import MemoryDecisions from "./MemoryDecisions";
import DesktopPersonaManagement from "./DesktopPersonaManagement";
import DesktopMemoryCenter from "./DesktopMemoryCenter";
import ChatWithAiMono from "./ChatWithAiMono";
import ConversationMemoryMono from "./ConversationMemoryMono";

export const PREVIEWS = [
  {
    slug: "desktop-chat-hub",
    title: "Desktop Chat Hub",
    group: "Deep Dark · Desktop",
    viewport: "desktop",
    component: ChatHubPage,
  },
  {
    slug: "conversations",
    title: "Conversations",
    group: "Deep Dark · Mobile",
    viewport: "mobile",
    component: Conversations,
  },
  {
    slug: "chat-with-ai",
    title: "Chat with AI",
    group: "Deep Dark · Mobile",
    viewport: "mobile",
    component: ChatWithAi,
  },
  {
    slug: "ai-personas",
    title: "AI Personas",
    group: "Deep Dark · Mobile",
    viewport: "mobile",
    component: AiPersonas,
  },
  {
    slug: "memory-decisions",
    title: "Memory & Decisions",
    group: "Deep Dark · Mobile",
    viewport: "mobile",
    component: MemoryDecisions,
  },
  {
    slug: "desktop-persona-management",
    title: "Desktop Persona Management",
    group: "Deep Dark · Desktop",
    viewport: "desktop",
    component: DesktopPersonaManagement,
  },
  {
    slug: "desktop-memory-center",
    title: "Desktop Memory Center",
    group: "Deep Dark · Desktop",
    viewport: "desktop",
    component: DesktopMemoryCenter,
  },
  {
    slug: "chat-with-ai-mono",
    title: "Chat with AI",
    group: "Monochrome · Mobile",
    viewport: "mobile",
    component: ChatWithAiMono,
  },
  {
    slug: "conversation-memory-mono",
    title: "Conversation Memory",
    group: "Monochrome · Mobile",
    viewport: "mobile",
    component: ConversationMemoryMono,
  },
];

export function getPreview(slug) {
  return PREVIEWS.find((p) => p.slug === slug) || null;
}
