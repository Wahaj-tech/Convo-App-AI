import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { usePersonaStore } from "../store/usePersonaStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, SparklesIcon } from "lucide-react";

function MessageInput() {
  const  playRandomKeyStrokeSound  = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, isSoundEnabled, selectedConversation } = useChatStore();
  const { personas, getPersonas, handleOf } = usePersonaStore();

  // Make sure we have personas loaded for the @mention autocomplete.
  useEffect(() => {
    if (!personas.length) getPersonas();
  }, [personas.length, getPersonas]);

  // The personas summonable here: the conversation's enabled list, or the defaults.
  const available =
    selectedConversation?.personas?.length
      ? selectedConversation.personas
      : personas.filter((p) => p.isDefault);

  // Are we mid-@mention? Look at the word currently being typed at the cursor end.
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

  const handleSendMessage = (e, isAiPrompt = false) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    const currentText = text.trim();
    const currentImage = imagePreview;

    // Reset state early for better UX
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    sendMessage({
      text: currentText,
      image: currentImage,
      isAiPrompt: isAiPrompt,
    });
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

  return (
    <div className="p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto relative">
        {/* @mention autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-2">Mention a persona</p>
            {suggestions.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => applyMention(p)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 transition-colors text-left"
              >
                <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-slate-200">{p.name}</span>
                <span className="text-xs text-violet-400/80 ml-auto">@{handleOf(p.name)}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
            placeholder="Type a message…  (try @CodeReviewer or @ai)"
          />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
              imagePreview ? "text-cyan-500" : ""
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleSendMessage(e, true)}
            disabled={!text.trim() && !imagePreview}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            title="Ask AI"
          >
            <SparklesIcon className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={!text.trim() && !imagePreview}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
export default MessageInput;
