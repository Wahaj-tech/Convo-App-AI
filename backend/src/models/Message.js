import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    /*Before: Every message had senderId and receiverId — "from person A to person B." This only works for 1-on-1.
  After: Every message has a conversationId — "this message belongs to this conversation." */
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },//This is the key change. Instead of "who sent this to whom," it's "which conversation does this belong to." When you open a chat, the app just does Message.find({ conversationId }) — give me all messages in this room. Works for 2 people or 20 people.
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderType: {//his does nothing right now. It's prep for Phase 2 when AI will send messages. We need to distinguish "a human sent this" from "the AI sent this" so the frontend can style them differently. It defaults to "user" so all current messages work without changes.
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },
    // Phase 4: when senderType is "ai", this records WHICH persona spoke
    // (Code Reviewer, Project Manager, etc.). Populated so the UI can render the
    // message with that persona's name/color. Null for plain/legacy AI messages.
    personaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona",
      default: null,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },//Notice required: true was removed. In the old system every message needed a receiver. In the new system, the conversation knows who the members are —individual messages don't need to specify a receiver. We keep the field so old data doesn't break, but new group messages won't set it.
    text: {
      type: String,
      trim: true,
      // 8000 chars: humans rarely approach this, but AI persona replies (e.g. a
      // detailed code review) can exceed the old 2000 limit. ai.service also
      // truncates to this length as a guarantee, so a long reply never fails to save.
      maxlength: 8000,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;