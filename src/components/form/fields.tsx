"use client";

import * as React from "react";
import { Field, Input, Textarea, Select, Options } from "@/components/ui/field";
import { useFieldError } from "./action-form";

export function TextField({
  name,
  label,
  required,
  hint,
  type = "text",
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  className?: string;
}) {
  const error = useFieldError(name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <Input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
      />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  rows,
  className,
}: {
  name: string;
  label?: string;
  hint?: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const error = useFieldError(name);
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <Textarea name={name} rows={rows} placeholder={placeholder} defaultValue={defaultValue ?? undefined} />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  required,
  options,
  placeholder,
  defaultValue,
  hint,
  className,
}: {
  name: string;
  label?: string;
  required?: boolean;
  options: readonly (string | number | { value: string; label: string })[];
  placeholder?: string;
  defaultValue?: string | number | null;
  hint?: string;
  className?: string;
}) {
  const error = useFieldError(name);
  return (
    <Field label={label} error={error} required={required} hint={hint} className={className}>
      <Select name={name} defaultValue={defaultValue ?? ""} required={required}>
        <Options items={options} placeholder={placeholder} />
      </Select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1.5 text-sm text-ink-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30"
      />
      {label}
    </label>
  );
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={
        cols === 1
          ? "space-y-4"
          : cols === 3
            ? "grid grid-cols-1 gap-4 sm:grid-cols-3"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2"
      }
    >
      {children}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</legend>
      {children}
    </fieldset>
  );
}
