"use client";

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

export default function FeeDisclosure({ fee }: { fee: number }) {
  if (fee <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-text-muted">
      <InfoIcon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs">
        A {fee}% handling fee applies to all crypto purchases
      </span>
    </div>
  );
}
