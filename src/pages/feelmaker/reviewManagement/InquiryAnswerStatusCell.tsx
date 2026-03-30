export function InquiryAnswerStatusCell({ answeredAt }: { answeredAt: string | null }) {
  const answered = answeredAt !== null;
  return (
    <span
      className={[
        'admin-status-pill',
        answered ? 'admin-status-pill--답변완료' : 'admin-status-pill--미답변',
      ].join(' ')}
    >
      {answered ? '답변완료' : '미답변'}
    </span>
  );
}
