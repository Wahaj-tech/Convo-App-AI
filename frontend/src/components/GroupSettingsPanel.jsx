import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { XIcon, ImageIcon, UserPlusIcon, LogOutIcon, UserMinusIcon, ShieldCheckIcon } from "lucide-react";
import toast from "react-hot-toast";

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
        await updateGroup(selectedConversation._id, {
            name: groupName.trim(),
            groupImage: groupImage
        });
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
        contact => !selectedConversation.members.some(m => m._id === contact._id)
    );

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-200">Group Info</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Group Info Section */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <div className="size-24 rounded-3xl bg-slate-700 flex items-center justify-center overflow-hidden border-4 border-slate-800 shadow-xl">
                            <img 
                                src={groupImage || selectedConversation.groupImage || "/avatar.png"} 
                                alt="Group" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={() => document.getElementById('group-img-edit').click()}
                                className="absolute -bottom-2 -right-2 p-2 bg-cyan-500 rounded-xl text-white shadow-lg hover:bg-cyan-600 transition-colors"
                            >
                                <ImageIcon className="w-4 h-4" />
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
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <button type="submit" className="flex-1 py-1.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">Save</button>
                                <button type="button" onClick={() => { setIsEditing(false); setGroupName(selectedConversation.name); }} className="flex-1 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-200 flex items-center justify-center">
                                {selectedConversation.name}
                                {isAdmin && (
                                    <button onClick={() => setIsEditing(true)} className="ml-2 text-slate-500 hover:text-cyan-500 transition-colors">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">{selectedConversation.members.length} members</p>
                        </div>
                    )}
                </div>

                {/* Members Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</h4>
                        {isAdmin && (
                            <button 
                                onClick={() => setShowAddMember(!showAddMember)}
                                className="text-xs text-cyan-500 hover:text-cyan-400 font-medium flex items-center"
                            >
                                <UserPlusIcon className="w-3 h-3 mr-1" /> Add
                            </button>
                        )}
                    </div>

                    {showAddMember && isAdmin && (
                        <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-700 animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] text-slate-500 mb-2 px-2 uppercase font-bold">Add from contacts</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                {potentialNewMembers.map(contact => (
                                    <div key={contact._id} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-lg transition-colors group">
                                        <div className="flex items-center space-x-2">
                                            <img src={contact.profilePic || "/avatar.png"} className="size-8 rounded-full" alt="" />
                                            <span className="text-slate-300 text-sm truncate w-32">{contact.fullName}</span>
                                        </div>
                                        <button onClick={() => handleAddMember(contact._id)} className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg hover:bg-cyan-500 hover:text-white transition-all">
                                            <UserPlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {potentialNewMembers.length === 0 && (
                                    <p className="text-center text-slate-500 text-xs py-4">No more contacts to add</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {selectedConversation.members.map(member => (
                            <div key={member._id} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full" alt="" />
                                        {selectedConversation.admin === member._id && (
                                            <div className="absolute -top-1 -right-1 size-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                                                <ShieldCheckIcon className="w-2 h-2 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-200 text-sm font-medium truncate w-36">{member.fullName} {member._id === authUser?._id && "(You)"}</span>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">
                                            {selectedConversation.admin === member._id ? "Admin" : "Member"}
                                        </span>
                                    </div>
                                </div>
                                {isAdmin && member._id !== authUser?._id && (
                                    <button 
                                        onClick={() => handleRemoveMember(member._id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Remove member"
                                    >
                                        <UserMinusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6">
                    <button 
                        onClick={handleLeaveGroup}
                        className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold"
                    >
                        <LogOutIcon className="w-5 h-5" />
                        <span>Leave Group</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsPanel;
