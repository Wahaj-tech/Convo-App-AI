import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { ImageIcon, XIcon, SearchIcon, CheckIcon } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { allContacts, createConversation } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupImage, setGroupImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

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
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return toast.error("Group name is required");
        if (selectedMembers.length < 2) return toast.error("Select at least 2 other members");

        await createConversation({
            type: "group",
            name: groupName.trim(),
            members: selectedMembers,
            groupImage: groupImage
        });

        onClose();
        // Reset state
        setGroupName("");
        setSelectedMembers([]);
        setGroupImage(null);
    };

    if (!isOpen) return null;

    const filteredContacts = allContacts.filter(contact =>
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-200">New Group Chat</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* Group Image & Name */}
                        <div className="flex items-center space-x-4">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('group-img-upload').click()}>
                                <div className="size-16 rounded-2xl bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-600 group-hover:border-cyan-500 transition-colors">
                                    {groupImage ? (
                                        <img src={groupImage} alt="Group" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-slate-500 group-hover:text-cyan-500" />
                                    )}
                                </div>
                                <input id="group-img-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Search Contacts */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Contacts List */}
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contacts</p>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredContacts.map(contact => (
                                    <div
                                        key={contact._id}
                                        onClick={() => toggleMember(contact._id)}
                                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                                            selectedMembers.includes(contact._id) 
                                            ? "bg-cyan-500/10 border border-cyan-500/50" 
                                            : "hover:bg-slate-700/50 border border-transparent"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img src={contact.profilePic || "/avatar.png"} className="size-10 rounded-full" alt="" />
                                            <span className="text-slate-200 text-sm font-medium">{contact.fullName}</span>
                                        </div>
                                        {selectedMembers.includes(contact._id) && (
                                            <div className="size-5 rounded-full bg-cyan-500 flex items-center justify-center">
                                                <CheckIcon className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredContacts.length === 0 && (
                                    <p className="text-center text-slate-500 text-sm py-4">No contacts found</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                        <button
                            type="submit"
                            disabled={!groupName.trim() || selectedMembers.length < 2}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                        >
                            Create Group ({selectedMembers.length + 1} Members)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
