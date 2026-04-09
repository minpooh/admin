import { Copy } from 'lucide-react';
import { copyTextToClipboard } from '../utils/customerInfoClipboard';

type ListRowCopyButtonProps = {
  text: string;
  onCopied: () => void;
  ariaLabel?: string;
};

export default function ListRowCopyButton({
  text,
  onCopied,
  ariaLabel = '행 정보 복사',
}: ListRowCopyButtonProps) {
  return (
    <button
      type="button"
      className="row-icon-btn row-icon-btn--tone-gray row-icon-btn--compact"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={async (e) => {
        e.stopPropagation();
        const ok = await copyTextToClipboard(text);
        if (ok) onCopied();
      }}
    >
      <Copy size={12} aria-hidden="true" />
    </button>
  );
}
