import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const buttonStyles = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-white text-zinc-900 ring-1 ring-zinc-300 hover:bg-zinc-100",
  danger: "bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50",
};

type Variant = keyof typeof buttonStyles;

function buttonClass(variant: Variant) {
  return `inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${buttonStyles[variant]}`;
}

/** Standard button. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${buttonClass(variant)} ${className}`} {...props} />;
}

/** Link styled as a button. */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonClass(variant)} ${className}`} {...props} />;
}

const fieldClass =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-xs placeholder:text-zinc-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

/** Labelled form field wrapper with an optional error message. */
export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input className={fieldClass} {...props} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea className={fieldClass} rows={4} {...props} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select className={fieldClass} {...props} />;
}

/** White content panel. */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-lg bg-white p-5 shadow-xs ring-1 ring-zinc-200 ${className}`}
      {...props}
    />
  );
}

/** Page title row with optional actions on the right. */
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="bg-linear-to-r from-indigo-700 to-fuchsia-600 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        {title}
      </h1>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/** Placeholder shown when a list has no items. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-600">{children}</div>}
    </div>
  );
}

/** Inline status message for form results. */
export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  if (success)
    return (
      <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
        {success}
      </p>
    );
  return null;
}

/** Simple skeleton block for loading states. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 ${className}`} />;
}
