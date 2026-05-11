import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function SmsConsentText({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed ${className}`}>
      By providing your phone number, you agree to receive SMS messages from EarmuffsGemach
      regarding requests, pickup updates, return reminders, onboarding, and support. Message
      frequency varies. Reply <strong>STOP</strong> to unsubscribe and <strong>HELP</strong> for
      assistance. Message and data rates may apply. See our{" "}
      <a href="/sms-policy" className="underline hover:no-underline" target="_blank" rel="noreferrer">
        SMS Policy
      </a>{" "}
      and{" "}
      <a href="/privacy-policy" className="underline hover:no-underline" target="_blank" rel="noreferrer">
        Privacy Policy
      </a>
      .
    </p>
  );
}

interface SmsConsentCheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  labelClassName?: string;
}

export function SmsConsentCheckbox({
  id = "sms-consent",
  checked,
  onCheckedChange,
  labelClassName = "",
}: SmsConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <Label htmlFor={id} className={`text-sm font-normal leading-snug cursor-pointer ${labelClassName}`}>
        I agree to receive SMS updates about my request and Gemach communication.
      </Label>
    </div>
  );
}
