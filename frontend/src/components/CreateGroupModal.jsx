import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { ImageIcon, XIcon, SearchIcon, CheckIcon } from "lucide-react";
import toast from "react-hot-toast";
import { C } from "../lib/theme";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { allContacts, createConversation } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupImage, setGroupImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setGroupImage(reader.result);
        reader.readAsDataURL(file);
    };

    const toggleMember = (memberId) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
        );
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (submitting) return; // guard against double-submit (prevents duplicate groups)
        if (!groupName.trim()) return toast.error("Group name is required");
        if (selectedMembers.length < 2) return toast.error("Select at least 2 other members");

        setSubmitting(true);
        try {
            await createConversation({ type: "group", name: groupName.trim(), members: selectedMembers, groupImage });
            onClose();
            setGroupName("");
            setSelectedMembers([]);
            setGroupImage(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const filteredContacts = allContacts.filter((c) =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border" style={{ background: C.panel, borderColor: C.border }}>
                {/* header */}
                <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
                    <h2 className="text-xl font-bold" style={{ color: C.text }}>New Group Chat</h2>
                    <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
                        <XIcon className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateGroup} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {/* image + name */}
                        <div className="flex items-center gap-4">
                            <div className="group relative cursor-pointer" onClick={() => document.getElementById("group-img-upload").click()}>
                                <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed" style={{ background: C.panelAlt, borderColor: C.border }}>
                                    {groupImage ? (
                                        <img src={groupImage} alt="Group" className="size-full object-cover" />
                                    ) : (
                                        <ImageIcon className="size-6" style={{ color: C.muted }} />
                                    )}
                                </div>
                                <input id="group-img-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="flex-1 rounded-xl border px-4 py-2 outline-none"
                                style={{ background: C.panelAlt, borderColor: C.border, color: C.text }}
                            />
                        </div>

                        {/* search */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: C.muted }} />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border py-2 pl-10 pr-4 text-sm outline-none"
                                style={{ background: C.panelAlt, borderColor: C.border, color: C.text }}
                            />
                        </div>

                        {/* contacts */}
                        <div className="space-y-1">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Contacts</p>
                            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                                {filteredContacts.map((contact) => {
                                    const on = selectedMembers.includes(contact._id);
                                    return (
                                        <div
                                            key={contact._id}
                                            onClick={() => toggleMember(contact._id)}
                                            className="flex cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors"
                                            style={{ background: on ? C.tealDim : "transparent", borderColor: on ? C.teal : "transparent" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={contact.profilePic || "/avatar.png"} className="size-10 rounded-full" alt="" />
                                                <span className="text-sm font-medium" style={{ color: C.text }}>{contact.fullName}</span>
                                            </div>
                                            {on && (
                                                <div className="flex size-5 items-center justify-center rounded-full" style={{ background: C.teal }}>
                                                    <CheckIcon className="size-3" style={{ color: C.onAccent }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredContacts.length === 0 && (
                                    <p className="py-4 text-center text-sm" style={{ color: C.muted }}>No contacts found</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* footer */}
                    <div className="border-t p-4" style={{ borderColor: C.border }}>
                        <button
                            type="submit"
                            disabled={submitting || !groupName.trim() || selectedMembers.length < 2}
                            className="w-full rounded-xl py-3 font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: C.teal, color: C.onAccent }}
                        >
                            {submitting ? "Creating…" : `Create Group (${selectedMembers.length + 1} Members)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
