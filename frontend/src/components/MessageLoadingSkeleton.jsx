import { C } from "../lib/theme";

function MessagesLoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className="h-12 w-40 animate-pulse rounded-lg" style={{ background: C.panelAlt }} />
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;
