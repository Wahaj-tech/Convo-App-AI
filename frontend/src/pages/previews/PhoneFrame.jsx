import React from "react";

/*
  PhoneFrame — wraps a "mobile" design so it reads like a device on desktop
  (centered, fixed-width, rounded bezel) while filling the screen on real phones.

  On small screens (<480px) the bezel/centering drops away and the design goes
  full-bleed, so the same component is genuinely responsive on mobile browsers.
*/
export default function PhoneFrame({ children, bg = "#0b141a" }) {
  return (
    <div className="flex w-full justify-center">
      <div
        className="w-full overflow-hidden sm:my-4 sm:w-[390px] sm:rounded-[28px] sm:border sm:shadow-2xl"
        style={{ background: bg, borderColor: "#222d34", minHeight: "100dvh", maxWidth: "100%" }}
      >
        <div className="sm:h-[844px] sm:overflow-y-auto" style={{ minHeight: "100dvh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
