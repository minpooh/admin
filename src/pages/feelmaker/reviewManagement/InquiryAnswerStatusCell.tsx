export type InquiryAnswerStatus = '답변완료' | '미답변' | '댓글추가됨';

export function InquiryAnswerStatusCell({
  status,
  answeredAt,
}: {
  status?: InquiryAnswerStatus;
  /** @deprecated 호환용 — status 가 우선 */
  answeredAt?: string | null;
}) {
  const resolved: InquiryAnswerStatus =
    status ?? (answeredAt != null ? '답변완료' : '미답변');
  return (
    <span
      className={[
        'admin-status-pill',
        `admin-status-pill--${resolved}`,
      ].join(' ')}
    >
      {resolved}
    </span>
  );
}
