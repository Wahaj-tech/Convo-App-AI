import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { XIcon, ImageIcon, UserPlusIcon, LogOutIcon, UserMinusIcon, ShieldCheckIcon } from "lucide-react";
import toast from "react-hot-toast";
import { C } from "../lib/theme";

const GroupSettingsPanel = ({ isOpen, onClose }) => {
    const { selectedConversation, updateGroup, addGroupMembers, removeGroupMember, leaveGroup, allContacts } = useChatStore();
    const { authUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState(selectedConversation?.name || "");
    const [groupImage, setGroupImage] = useState(null);
    const [showAddMember, setShowAddMember] = useState(false);

    if (!isOpen || !selectedConversation || selectedConversation.type !== "group") return null;

    const isAdmin = selectedConversation.admin === authUser?._id;

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return toast.error("Group name is required");
        await updateGroup(selectedConversation._id, { name: groupName.trim(), groupImage });
        setIsEditing(false);
        setGroupImage(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setGroupImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleAddMember = async (memberId) => {
        await addGroupMembers(selectedConversation._id, [memberId]);
        setShowAddMember(false);
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            await removeGroupMember(selectedConversation._id, [memberId]);
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm("Are you sure you want to leave this group?")) {
            await leaveGroup(selectedConversation._id);
            onClose();
        }
    };

    const potentialNewMembers = allContacts.filter(
        (contact) => !selectedConversation.members.some((m) => m._id === contact._id)
    );

    const fieldStyle = { background: C.panelAlt, borderColor: C.border, color: C.text };

    return (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l shadow-2xl" style={{ background: C.panel, borderColor: C.border }}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
                <h2 className="text-lg font-bold" style={{ color: C.text }}>Group Info</h2>
                <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
                    <XIcon className="size-5" />
                </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
                {/* group identity */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4" style={{ background: C.panelAlt, borderColor: C.panel }}>
                            <img src={groupImage || selectedConversation.groupImage || "/avatar.png"} alt="Group" className="size-full object-cover" />
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => document.getElementById("group-img-edit").click()}
                                className="absolute -bottom-2 -right-2 rounded-xl p-2 shadow-lg"
                                style={{ background: C.teal, color: C.onAccent }}
                            >
                                <ImageIcon className="size-4" />
                            </button>
                        )}
                        <input id="group-img-edit" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>

                    {isEditing && isAdmin ? (
                        <form onSubmit={handleUpdateGroup} className="w-full space-y-2">
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 text-center outline-none"
                                style={fieldStyle}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 rounded-lg py-1.5 text-sm font-medium" style={{ background: C.teal, color: C.onAccent }}>Save</button>
                                <button type="button" onClick={() => { setIsEditing(false); setGroupName(selectedConversation.name); }} className="flex-1 rounded-lg py-1.5 text-sm font-medium" style={{ background: C.active, color: C.text }}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center">
                            <h3 className="flex items-center justify-center text-xl font-bold" style={{ color: C.text }}>
                                {selectedConversation.name}
                                {isAdmin && (
                                    <button onClick={() => setIsEditing(true)} className="ml-2" style={{ color: C.muted }}>
                                        <ShieldCheckIcon className="size-4" />
                                    </button>
                                )}
                            </h3>
                            <p className="mt-1 text-sm" style={{ color: C.muted }}>{selectedConversation.members.length} members</p>
                        </div>
                    )}
                </div>

                {/* members */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Members</h4>
                        {isAdmin && (
                            <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center text-xs font-medium" style={{ color: C.teal }}>
                                <UserPlusIcon className="mr-1 size-3" /> Add
                            </button>
                        )}
                    </div>

                    {showAddMember && isAdmin && (
                        <div className="rounded-xl border p-2" style={{ background: C.deep, borderColor: C.border }}>
                            <p className="mb-2 px-2 text-[10px] font-bold uppercase" style={{ color: C.muted }}>Add from contacts</p>
                            <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                                {potentialNewMembers.map((contact) => (
                                    <div key={contact._id} className="flex items-center justify-between rounded-lg p-2">
                                        <div className="flex items-center gap-2">
                                            <img src={contact.profilePic || "/avatar.png"} className="size-8 rounded-full" alt="" />
                                            <span className="w-32 truncate text-sm" style={{ color: C.text }}>{contact.fullName}</span>
                                        </div>
                                        <button onClick={() => handleAddMember(contact._id)} className="rounded-lg p-1.5" style={{ background: C.tealDim, color: C.teal }}>
                                            <UserPlusIcon className="size-4" />
                                        </button>
                                    </div>
                                ))}
                                {potentialNewMembers.length === 0 && (
                                    <p className="py-4 text-center text-xs" style={{ color: C.muted }}>No more contacts to add</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {selectedConversation.members.map((member) => (
                            <div key={member._id} className="group flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full" alt="" />
                                        {selectedConversation.admin === member._id && (
                                            <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2" style={{ background: "#f59e0b", borderColor: C.panel }}>
                                                <ShieldCheckIcon className="size-2" style={{ color: "#fff" }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="w-36 truncate text-sm font-medium" style={{ color: C.text }}>
                                            {member.fullName} {member._id === authUser?._id && "(You)"}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: C.muted }}>
                                            {selectedConversation.admin === member._id ? "Admin" : "Member"}
                                        </span>
                                    </div>
                                </div>
                                {isAdmin && member._id !== authUser?._id && (
                                    <button onClick={() => handleRemoveMember(member._id)} className="rounded-xl p-2 transition-all" style={{ color: "#e06c75" }} title="Remove member">
                                        <UserMinusIcon className="size-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* leave */}
                <div className="pt-4">
                    <button
                        onClick={handleLeaveGroup}
                        className="flex w-full items-center justify-center gap-2 rounded-xl p-3 font-bold transition-colors"
                        style={{ background: "rgba(224,108,117,0.12)", color: "#e06c75" }}
                    >
                        <LogOutIcon className="size-5" />
                        <span>Leave Group</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsPanel;
