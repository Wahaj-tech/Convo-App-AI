import mongoose from "mongoose";

const conversationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],//Every conversation is either "direct" (1-on-1, like now) or "group". The enum means Mongo will reject anything else — you can't accidentally create a conversation with type: "random".
      required: true,
    },
    name: {
      type: String,
      maxlength: 100,
      default: null,
    },//Direct chats don't need a name (you just show the other person's name). Group chats do — like "Project Team" or "Weekend Plans". The validation hook at thebottom enforces this
    groupImage: {
      type: String,
      default: "",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],//An array of user IDs — who's in this conversation. For direct chats it's always 2 people. For groups it can be 3+. The ref: "User" lets us later call .populate("members") to get the full user objects (name, profile pic) instead of just IDs.
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },//Who created the group. Only they can add/remove members or rename it. Direct chats have no admin (null).
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },//These are for performance. When you open the app, the sidebar shows all your conversations sorted by most recent, with a preview of the last message. Withoutthese fields, you'd have to search through the entire Messages collection for every single conversation each time — very slow. Instead, every time a message is sent, we update these two fields on the conversation, so the sidebar query is instant.
    // Phase 4: which AI personas are "enabled" in this conversation. If empty,
    // the app falls back to the default personas, so mentioning @CodeReviewer
    // works out of the box. Curating this list controls the @mention autocomplete.
    personas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Persona",
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1, type: 1 });
conversationSchema.index({ lastMessageAt: -1 });

conversationSchema.pre("validate", function () {
  if (this.type === "group" && !this.name) {
    throw new Error("Group conversations require a name");
  }
});//This runs before Mongoose saves to the database. If someone tries to create a group with no name, it stops them.

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;

/*conversationSchema.index({ members: 1, type: 1 });
  conversationSchema.index({ lastMessageAt: -1 });
  Indexes are like the index at the back of a book — they let MongoDB find data fast without scanning every document. The first one speeds up "find all
  conversations this user is in." The second speeds up "sort conversations by most recent."
  
  Think of a database index like a phone book. Without one, if you want to find "Wahaj," you'd read every single entry from page 1 until you find it. With the
  phone book sorted alphabetically, you jump straight to "W." That's what an index does for MongoDB.

  ---
  conversationSchema.index({ members: 1, type: 1 })  //members: 1 means we're indexing the members field in ascending order. type: 1 means we're also including the type field in the index. This creates a compound index on both fields together.
  This speeds up the query: "Find all conversations this user is in."

  // This runs every time someone opens the app sidebar
  Conversation.find({ members: userId, type: "direct" })

  Without the index, Mongo scans every conversation in the entire database, checks the members array, checks the type. If you have 100,000 conversations but the
   user is only in 5, that's 99,995 wasted checks.

  With the index, Mongo keeps a sorted lookup table of members + type combinations. It jumps straight to the matching entries.

  The 1 just means ascending order — for this kind of lookup, direction doesn't matter much, it just needs to exist.

  ---
  conversationSchema.index({ lastMessageAt: -1 })

  This speeds up: "Give me conversations sorted by most recent activity."

  Conversation.find({ members: userId }).sort({ lastMessageAt: -1 })

  The -1 means descending — newest first. This matters for sorting. If Mongo stores the index newest-first, it can read the results in order without doing any
  sorting work at query time.

  Without it, Mongo fetches all your conversations, loads them into memory, then sorts them. With 10 conversations that's fine. With 10,000, it's slow.

  ---
  messageSchema.index({ conversationId: 1, createdAt: -1 })

  This is the most important one. It speeds up: "Load messages for this chat, newest first."

  Message.find({ conversationId: "abc123" }).sort({ createdAt: -1 }).limit(50)

  This is a compound index — two fields working together. Think of it like a filing cabinet:
  - First drawer: sorted by conversation (find the right chat)
  - Inside that drawer: sorted by date, newest first (grab the latest 50)

  Mongo opens the right drawer and reads 50 pages from the front. Done.

  Without this index, Mongo would scan every message across all conversations, filter out the ones matching this chat, then sort by date. If your app has 1
  million messages across all chats but this chat only has 200, that's brutal.

  ---
  When do indexes hurt?

  Indexes take up disk space and slightly slow down writes (every new message also updates the index). But for a chat app where you read messages far more often
   than you write them, it's a huge net win.

✻ Cooked for 18s

❯ can you give me a example of each so that i can understand more perfecttly and does this 1 do in index of mermber and type                                    

● Examples With Real Data

  Let's say your database has these conversations:

  ID       | type     | members              | lastMessageAt
  ---------|----------|----------------------|------------------
  conv_001 | direct   | [Wahaj, Ali]         | May 14, 9:00 PM
  conv_002 | group    | [Wahaj, Ali, Sara]   | May 14, 8:30 PM
  conv_003 | direct   | [Ali, Sara]          | May 14, 7:00 PM
  conv_004 | group    | [Wahaj, Sara, Ahmed] | May 14, 9:15 PM
  conv_005 | direct   | [Ahmed, Ali]         | May 14, 6:00 PM

  ---
  index({ members: 1, type: 1 }) — What does the 1 do?
  
  The 1 means ascending (A→Z, smallest→largest). -1 would mean descending.

  Mongo builds a sorted lookup table behind the scenes that looks like this:

  MEMBER   | TYPE     | Points to
  ---------|----------|----------
  Ahmed    | direct   | conv_005
  Ahmed    | group    | conv_004
  Ali      | direct   | conv_001, conv_003, conv_005
  Ali      | group    | conv_002
  Sara     | direct   | conv_003
  Sara     | group    | conv_002, conv_004
  Wahaj    | direct   | conv_001
  Wahaj    | group    | conv_002, conv_004

  Sorted ascending by member name first, then by type within each member.

  Now when you query:

  Conversation.find({ members: "Wahaj" })

  Without index: Mongo opens every single conversation document (all 5), checks the members array of each one — "is Wahaj in here?"

  With index: Mongo jumps to "Wahaj" in the table (like jumping to "W" in a phone book), reads the 3 entries, done.

  And if you query:

  Conversation.find({ members: "Wahaj", type: "group" })

  Even faster — jumps to "Wahaj" then narrows to "group" → conv_002, conv_004. Two lookups instead of scanning 5 documents.

  If you used -1 instead of 1, the table would just be sorted Z→A instead of A→Z. For equality lookups like "find Wahaj," the direction doesn't matter — Mongo
  can search the sorted list either way. Direction only matters for sorting results.

  ---
  index({ lastMessageAt: -1 }) — Example

  The index table looks like:

  lastMessageAt        | Points to
  ---------------------|----------
  May 14, 9:15 PM      | conv_004
  May 14, 9:00 PM      | conv_001
  May 14, 8:30 PM      | conv_002
  May 14, 7:00 PM      | conv_003
  May 14, 6:00 PM      | conv_005

  Sorted newest first because of -1.

  When the sidebar runs:

  Conversation.find({ members: "Wahaj" }).sort({ lastMessageAt: -1 })

  Mongo returns: conv_004 (9:15), conv_001 (9:00), conv_002 (8:30) — your chats in the right order, no extra sorting step needed.

  If this was 1 instead of -1, the table would be oldest first. Mongo would have to read it backwards to give you newest first — still possible, but -1 matches
  the query direction so it's optimal.

  ---
  messageSchema.index({ conversationId: 1, createdAt: -1 }) — Example

  Say these messages exist:

  conversationId | createdAt    | text
  ---------------|--------------|------------------
  conv_001       | 9:00 PM      | "Hey!"
  conv_001       | 8:55 PM      | "What's up?"
  conv_001       | 8:50 PM      | "Check this out"
  conv_002       | 8:30 PM      | "Group meeting tmrw"
  conv_002       | 8:00 PM      | "Sure"
  conv_003       | 7:00 PM      | "Hello"

  The compound index is like a filing cabinet:

  conv_001 (drawer 1):
    ├── 9:00 PM  → "Hey!"
    ├── 8:55 PM  → "What's up?"
    └── 8:50 PM  → "Check this out"

  conv_002 (drawer 2):
    ├── 8:30 PM  → "Group meeting tmrw"
    └── 8:00 PM  → "Sure"

  conv_003 (drawer 3):
    └── 7:00 PM  → "Hello"

  When you open a chat:

  Message.find({ conversationId: "conv_001" }).sort({ createdAt: -1 }).limit(2)

  Without index: Mongo reads ALL 6 messages, filters for conv_001, sorts by date, takes 2.

  With index: Mongo opens drawer conv_001, reads the first 2 entries (already sorted newest-first because of -1), stops. Never even looks at conv_002 or
  conv_003.

  That's why it's a compound index — conversationId picks the drawer, createdAt: -1 means the contents are already in the right order.

  */