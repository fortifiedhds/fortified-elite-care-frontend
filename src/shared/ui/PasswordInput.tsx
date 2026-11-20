import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "type"> & {
  visibilityLabel?: string;
};

export function PasswordInput({
  id,
  disabled,
  visibilityLabel = "password",
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const action = `${visible ? "Hide" : "Show"} ${visibilityLabel}`;
  return (
    <span className="password-field">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-visibility"
        aria-label={action}
        title={action}
        aria-controls={inputId}
        aria-pressed={visible}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
