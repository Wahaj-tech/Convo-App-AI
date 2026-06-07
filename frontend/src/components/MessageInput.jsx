import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { usePersonaStore } from "../store/usePersonaStore";
import toast from "react-hot-toast";
import { Paperclip, Send, X, Sparkles, Landmark } from "lucide-react";
import { C } from "../lib/theme";

function MessageInput() {
  const playRandomKeyStrokeSound = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, isSoundEnabled, selectedConversation } = useChatStore();
  const { personas, getPersonas, handleOf } = usePersonaStore();

  useEffect(() => {
    if (!personas.length) getPersonas();
  }, [personas.length, getPersonas]);

  const available =
    selectedConversation?.personas?.length
      ? selectedConversation.personas
      : personas.filter((p) => p.isDefault);

  const mentionMatch = text.match(/@(\w*)$/);
  const query = mentionMatch ? mentionMatch[1].toLowerCase() : null;
  const suggestions =
    query !== null
      ? available.filter((p) => handleOf(p.name).startsWith(query)).slice(0, 5)
      : [];

  const applyMention = (persona) => {
    const h = handleOf(persona.name);
    setText(text.replace(/@(\w*)$/, `@${h} `));
    inputRef.current?.focus();
  };

  const handleSendMessage = (e, { isAiPrompt = false, isPanel = false } = {}) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    const currentText = text.trim();
    const currentImage = imagePreview;

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    sendMessage({ text: currentText, image: currentImage, isAiPrompt, isPanel });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = text.trim() || imagePreview;

  return (
    <div className="shrink-0 border-t px-4 pb-4 pt-4 md:px-6" style={{ background: C.panel, borderColor: C.border }}>
      {imagePreview && (
        <div className="mx-auto mb-3 flex max-w-3xl items-center">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="size-20 rounded-lg border object-cover" style={{ borderColor: C.border }} />
            <button
              onClick={removeImage}
              type="button"
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full"
              style={{ background: C.active, color: C.text }}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-3xl">
        {/* @mention autocomplete */}
        {suggestions.length > 0 && (
          <div
            className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border shadow-2xl"
            style={{ background: C.panelAlt, borderColor: C.border }}
          >
            <p className="px-3 pt-2 text-[10px] font-bold uppercase" style={{ color: C.muted }}>
              Mention a persona
            </p>
            {suggestions.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => applyMention(p)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-black/20"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                <span className="ml-auto text-xs" style={{ color: C.teal }}>@{handleOf(p.name)}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 rounded-lg border p-2" style={{ background: C.panelAlt, borderColor: C.border }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-9 shrink-0 items-center justify-center"
            style={{ color: imagePreview ? C.teal : C.muted }}
            title="Attach image"
          >
            <Paperclip className="size-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] outline-none"
            style={{ color: C.text }}
            placeholder="Message…  (try @CodeReviewer or @ai)"
          />

          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

          <button
            type="button"
            onClick={(e) => handleSendMessage(e, { isPanel: true })}
            disabled={!canSend}
            className="flex size-9 shrink-0 items-center justify-center rounded disabled:opacity-40"
            style={{ color: C.teal }}
            title="Convene AI Panel — all enabled personas deliberate, then a verdict"
          >
            <Landmark className="size-5" />
          </button>

          <button
            type="button"
            onClick={(e) => handleSendMessage(e, { isAiPrompt: true })}
            disabled={!canSend}
            className="flex size-9 shrink-0 items-center justify-center rounded disabled:opacity-40"
            style={{ color: C.teal }}
            title="Ask AI"
          >
            <Sparkles className="size-5" />
          </button>

          <button
            type="submit"
            disabled={!canSend}
            className="flex size-10 shrink-0 items-center justify-center rounded disabled:opacity-40"
            style={{ background: C.teal, color: C.deep }}
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
export default MessageInput;
