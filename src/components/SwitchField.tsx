type Props = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  checkedText: string;
  uncheckedText: string;
};

export default function SwitchField({ label, checked, onChange, checkedText, uncheckedText }: Props) {
  return (
    <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
      <span className="admin-accordion-field__label">{label}</span>
      <button
        type="button"
        className={`admin-toggle-switch ${checked ? 'is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="admin-toggle-switch__track" aria-hidden>
          <span className="admin-toggle-switch__thumb" />
        </span>
        <span className="admin-toggle-switch__text">{checked ? checkedText : uncheckedText}</span>
      </button>
    </div>
  );
}
