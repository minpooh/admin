import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

type ModalVariant = 'app' | 'option' | 'sms';

type ModalClassNames = {
  overlay: string;
  panel: string;
  header: string;
  title: string;
  close: string;
  body: string;
  footer: string;
};

const VARIANT_CLASSNAMES: Record<ModalVariant, ModalClassNames> = {
  app: {
    overlay: 'app-modal__overlay',
    panel: 'app-modal__panel',
    header: 'app-modal__header',
    title: 'app-modal__title',
    close: 'app-modal__close',
    body: 'app-modal__body',
    footer: 'app-modal__footer',
  },
  option: {
    overlay: 'option-modal__overlay',
    panel: 'option-modal__panel',
    header: 'option-modal__header',
    title: 'option-modal__title',
    close: 'option-modal__close',
    body: 'option-modal__body',
    footer: 'option-modal__footer',
  },
  sms: {
    overlay: 'sms-modal__overlay',
    panel: 'sms-modal__panel',
    header: 'sms-modal__header',
    title: 'sms-modal__title',
    close: 'sms-modal__close',
    body: 'sms-modal__body',
    footer: 'sms-modal__footer',
  },
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
  variant?: ModalVariant;
  closeButtonAriaLabel?: string;
};

type ModalContextValue = {
  onClose: () => void;
  classNames: ModalClassNames;
  closeButtonAriaLabel: string;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal compound components must be used within <Modal>.');
  return ctx;
}

function ModalRoot({
  open,
  onClose,
  ariaLabel,
  children,
  variant = 'app',
  closeButtonAriaLabel = '닫기',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const classNames = VARIANT_CLASSNAMES[variant];

  return (
    <ModalContext.Provider value={{ onClose, classNames, closeButtonAriaLabel }}>
      <div
        className={classNames.overlay}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onMouseDown={() => onClose()}
      >
        <div className={classNames.panel} onMouseDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

function Header({ children }: { children: ReactNode }) {
  const { classNames } = useModalContext();
  return <div className={classNames.header}>{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
  const { classNames } = useModalContext();
  return <div className={classNames.title}>{children}</div>;
}

function Close() {
  const { onClose, classNames, closeButtonAriaLabel } = useModalContext();
  return (
    <button type="button" className={classNames.close} onClick={() => onClose()} aria-label={closeButtonAriaLabel}>
      ×
    </button>
  );
}

function Body({ children }: { children: ReactNode }) {
  const { classNames } = useModalContext();
  return <div className={classNames.body}>{children}</div>;
}

function Footer({ children }: { children: ReactNode }) {
  const { classNames } = useModalContext();
  return <div className={classNames.footer}>{children}</div>;
}

type ModalComponent = typeof ModalRoot & {
  Header: typeof Header;
  Title: typeof Title;
  Close: typeof Close;
  Body: typeof Body;
  Footer: typeof Footer;
};

const Modal = ModalRoot as ModalComponent;
Modal.Header = Header;
Modal.Title = Title;
Modal.Close = Close;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;

