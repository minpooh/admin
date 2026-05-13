import { useState } from 'react';
import { Copy } from 'lucide-react';
import Alert from './Alert';
import { copyTextToClipboard, CUSTOMER_INFO_COPIED_ALERT_MESSAGE } from '../utils/customerInfoClipboard';

type ListRowCopyButtonProps = {
  text: string;
  onCopied?: () => void;
  ariaLabel?: string;
};

export default function ListRowCopyButton({
  text,
  ariaLabel = '행 정보 복사',
}: ListRowCopyButtonProps) {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="row-icon-btn row-icon-btn--tone-gray row-icon-btn--compact"
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={async (e) => {
          e.stopPropagation();
          const ok = await copyTextToClipboard(text);
          if (!ok) return;
          setAlertOpen(true);
        }}
      >
        <Copy size={12} aria-hidden="true" />
      </button>
      <Alert
        open={alertOpen}
        message={CUSTOMER_INFO_COPIED_ALERT_MESSAGE}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}
