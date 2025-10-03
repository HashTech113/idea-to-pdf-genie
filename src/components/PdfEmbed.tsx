type EmbedProps = {
  url: string;      // signed URL from get-report
  height?: string;  // e.g. "800px"
  className?: string;
};

export function PdfEmbed({ url, height = "800px", className = "" }: EmbedProps) {
  return (
    <div className={`w-full overflow-hidden rounded-xl shadow ${className}`}>
      <iframe
        src={url}
        width="100%"
        height={height}
        style={{ border: "none" }}
        title="PDF Preview"
      />
    </div>
  );
}
