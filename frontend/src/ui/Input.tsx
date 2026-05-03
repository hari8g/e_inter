import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const box =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${box} ${props.className || ""}`} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${box} ${props.className || ""}`} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      className={`${box} min-h-[120px] resize-y ${props.className || ""}`}
      {...props}
    />
  );
}
