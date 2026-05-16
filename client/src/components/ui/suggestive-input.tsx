import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  suggestBestMatch,
  type CanonicalEntry,
  type SuggestOptions,
} from "@/lib/name-suggest";

export interface SuggestiveInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  /** Canonical entries (each may have EN + HE form) to suggest against. */
  entries: CanonicalEntry[];
  /** Optional tuning of the matching algorithm. */
  matchOptions?: SuggestOptions;
  /** Optional class for the wrapping div. */
  wrapperClassName?: string;
  /** Forwarded form-state ref support. */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Input wrapper that quietly shows the closest existing canonical value
 * as an inline chip below the field. Press Tab or ArrowDown to accept,
 * Escape (or just keep typing) to dismiss. If no good match exists, the
 * field renders exactly like a plain Input.
 */
export const SuggestiveInput = React.forwardRef<HTMLInputElement, SuggestiveInputProps>(
  (
    {
      value,
      onChange,
      entries,
      matchOptions,
      wrapperClassName,
      onKeyDown,
      onBlur,
      onFocus,
      className,
      inputRef,
      ...inputProps
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [dismissed, setDismissed] = React.useState(false);
    const lastValueRef = React.useRef(value ?? "");

    React.useEffect(() => {
      if ((value ?? "") !== lastValueRef.current) {
        lastValueRef.current = value ?? "";
        setDismissed(false);
      }
    }, [value]);

    const safeEntries = Array.isArray(entries) ? entries : [];
    const suggestion = React.useMemo(() => {
      if (!safeEntries.length) return null;
      if (dismissed) return null;
      return suggestBestMatch(value ?? "", safeEntries, matchOptions);
    }, [value, safeEntries, dismissed, matchOptions]);

    const showSuggestion = !!suggestion && focused;
    const announce = showSuggestion
      ? `Did you mean ${suggestion!.canonical}? Press Tab to accept.`
      : "";

    const accept = () => {
      if (!suggestion) return;
      onChange?.(suggestion.canonical);
      setDismissed(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestion) {
        if (e.key === "Tab" && !e.shiftKey) {
          e.preventDefault();
          accept();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          accept();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setDismissed(true);
          return;
        }
      }
      onKeyDown?.(e);
    };

    const mergedRef = (el: HTMLInputElement | null) => {
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      if (typeof inputRef === "function") inputRef(el);
      else if (inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Input
          {...inputProps}
          ref={mergedRef}
          className={className}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          aria-autocomplete="inline"
        />
        {showSuggestion && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
              accept();
            }}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            data-testid="name-suggestion-chip"
          >
            <span aria-hidden>→</span>
            <span className="font-medium">{suggestion!.canonical}</span>
            <span className="text-[10px] opacity-70">Tab</span>
          </button>
        )}
        <span className="sr-only" aria-live="polite">{announce}</span>
      </div>
    );
  },
);
SuggestiveInput.displayName = "SuggestiveInput";
