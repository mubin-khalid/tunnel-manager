import type { FormFieldProps } from "@/types/component-props";

/** Label + optional hint wrapping arbitrary field children for consistent spacing. */
export default function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
        {label}
        {hint ? (
          <span className="text-[10px] font-normal normal-case opacity-50 ml-1">
            {hint}
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
