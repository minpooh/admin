export const CUSTOMER_INFO_COPIED_ALERT_MESSAGE = '고객정보가 복사되었습니다';

export function formatCustomerClipboardText(name: string, id: string, phone: string): string {
  return `${name}\n ${id}\n ${phone}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function copyCustomerToClipboard(name: string, id: string, phone: string): Promise<boolean> {
  return copyTextToClipboard(formatCustomerClipboardText(name, id, phone));
}
