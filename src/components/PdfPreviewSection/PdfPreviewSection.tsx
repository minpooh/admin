import './PdfPreviewSection.css';

type PdfPreviewSectionProps = {
  pdfUrl: string;
  iframeTitle?: string;
};

export default function PdfPreviewSection({
  pdfUrl,
  iframeTitle = 'PDF 미리보기',
}: PdfPreviewSectionProps) {
  return (
    <div className="admin-pdf-preview-wrap">
      <iframe className="admin-pdf-preview" title={iframeTitle} src={pdfUrl} />
    </div>
  );
}
