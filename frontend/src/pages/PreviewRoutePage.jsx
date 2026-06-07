import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPreview } from "./previews/registry";
import PhoneFrame from "./previews/PhoneFrame";

/*
  Renders a single design preview by :slug. Desktop designs render full-width;
  mobile designs are wrapped in a PhoneFrame so they read like a device on
  desktop but go full-bleed on real phones.
*/
export default function PreviewRoutePage() {
  const { slug } = useParams();
  const preview = getPreview(slug);

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" style={{ color: "#e9edef" }}>
        <p className="text-lg">Design “{slug}” not found.</p>
        <Link to="/preview" className="text-sm underline" style={{ color: "#00a884" }}>
          Back to all designs
        </Link>
      </div>
    );
  }

  const Design = preview.component;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* back bar */}
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
        <Link
          to="/preview"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#8696a0" }}
        >
          <ArrowLeft size={16} />
          All designs
        </Link>
        <span className="text-sm" style={{ color: "#8696a0" }}>
          {preview.title}
        </span>
      </div>

      {preview.viewport === "desktop" ? <Design /> : <PhoneFrame>{<Design />}</PhoneFrame>}
    </div>
  );
}
