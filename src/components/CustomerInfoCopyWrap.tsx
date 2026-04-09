import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { copyCustomerToClipboard } from '../utils/customerInfoClipboard';

type CustomerInfoCopyWrapProps = {
  customerName: string;
  customerId: string;
  customerPhone: string;
  onCopied: () => void;
  children: ReactNode;
};

export default function CustomerInfoCopyWrap({
  customerName,
  customerId,
  customerPhone,
  onCopied,
  children,
}: CustomerInfoCopyWrapProps) {
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const ok = await copyCustomerToClipboard(customerName, customerId, customerPhone);
    if (ok) onCopied();
  };

  return (
    <div className="admin-copy admin-cell-triple">
      {children}
      <div className="admin-copy__overlay">
        <span className="admin-copy__backdrop" aria-hidden />
        <button
          type="button"
          className="admin-copy__btn"
          aria-label="고객정보 복사"
          title="고객정보 복사"
          onClick={handleCopy}
        >
          <Copy size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
