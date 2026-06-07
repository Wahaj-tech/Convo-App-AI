import React, { useState } from "react";
import { X, Camera, Mail, User, Lock, LogOut, Volume2, VolumeX } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { C } from "../lib/theme";
import toast from "react-hot-toast";

/*
  Profile panel — a slide-in editor for the user's account: avatar, full name,
  an "about" bio, read-only email, change-password, sound preference, and logout.
  Replaces the old "click to upload avatar only" behaviour.
*/
const FIELD = { background: "#faf8f3", borderColor: C.border, color: C.text };
const AVATAR_INPUT = "profile-avatar-input";

export default function ProfilePanel({ isOpen, onClose }) {
  const { authUser, updateProfile, changePassword, logout } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [about, setAbout] = useState(authUser?.about || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  if (!isOpen || !authUser) return null;

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    const reader = new FileReader();
    reader.onloadend = () => updateProfile({ profilePic: reader.result });
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!fullName.trim()) return toast.error("Name can't be empty");
    setSavingProfile(true);
    await updateProfile({ fullName: fullName.trim(), about: about.trim() });
    setSavingProfile(false);
  };

  const submitPassword = async () => {
    if (!currentPassword || !newPassword) return toast.error("Fill in both password fields");
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("New passwords don't match");
    setChangingPw(true);
    const ok = await changePassword({ currentPassword, newPassword });
    setChangingPw(false);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const memberSince = authUser.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l shadow-2xl"
      style={{ background: C.panel, borderColor: C.border }}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: C.text }}>
          <User className="size-5" style={{ color: C.teal }} /> Profile
        </h2>
        <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* avatar */}
        <div className="flex flex-col items-center gap-3">
          <label htmlFor={AVATAR_INPUT} className="group relative cursor-pointer">
            <img
              src={authUser.profilePic || "/avatar.png"}
              alt={authUser.fullName}
              className="size-24 rounded-full object-cover"
              style={{ border: `2px solid ${C.border}` }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <Camera className="size-6" style={{ color: "#fff" }} />
            </span>
          </label>
          <input id={AVATAR_INPUT} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          {memberSince && (
            <p className="text-xs" style={{ color: C.muted }}>Member since {memberSince}</p>
          )}
        </div>

        {/* editable fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Full name
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3" style={FIELD}>
              <User size={16} style={{ color: C.muted }} />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={50}
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                style={{ color: C.text }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 opacity-70" style={FIELD}>
              <Mail size={16} style={{ color: C.muted }} />
              <input value={authUser.email} disabled className="w-full bg-transparent py-2.5 text-sm outline-none" style={{ color: C.muted }} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              About
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="A short line about you…"
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={FIELD}
            />
            <p className="mt-1 text-right text-[11px]" style={{ color: C.muted }}>{about.length}/200</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: C.teal, color: C.onAccent }}
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* change password */}
        <div className="space-y-3 border-t pt-5" style={{ borderColor: C.border }}>
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
            <Lock size={15} style={{ color: C.muted }} /> Change password
          </h3>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
            style={FIELD}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
            style={FIELD}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
            style={FIELD}
          />
          <button
            onClick={submitPassword}
            disabled={changingPw}
            className="w-full rounded-lg border py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ borderColor: C.border, color: C.text }}
          >
            {changingPw ? "Updating…" : "Update password"}
          </button>
        </div>

        {/* preferences */}
        <div className="space-y-2 border-t pt-5" style={{ borderColor: C.border }}>
          <button
            onClick={toggleSound}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm"
            style={{ background: "#faf8f3", color: C.text }}
          >
            <span className="flex items-center gap-2">
              {isSoundEnabled ? <Volume2 size={16} style={{ color: C.muted }} /> : <VolumeX size={16} style={{ color: C.muted }} />}
              Notification sounds
            </span>
            <span style={{ color: isSoundEnabled ? C.teal : C.muted }}>{isSoundEnabled ? "On" : "Off"}</span>
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ background: "rgba(224,108,117,0.12)", color: "#e06c75" }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
