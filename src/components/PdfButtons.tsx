import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

type ButtonsProps = {
  type: "preview" | "full";
  url: string;              // view URL
  downloadUrl: string;      // signed URL with ?download=...
  allowPreviewDownload?: boolean; // default false
  fileLabel?: string;       // for aria-label
};

export function PdfButtons({
  type,
  url,
  downloadUrl,
  allowPreviewDownload = false,
  fileLabel = "Business Plan PDF",
}: ButtonsProps) {
  const canDownload = type === "full" || allowPreviewDownload;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        asChild
        variant="default"
        className="gap-2"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${fileLabel}`}
        >
          <ExternalLink className="w-4 h-4" />
          View PDF
        </a>
      </Button>

      <Button
        asChild={canDownload}
        variant={canDownload ? "secondary" : "outline"}
        disabled={!canDownload}
        className="gap-2"
      >
        {canDownload ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        ) : (
          <span>
            <Download className="w-4 h-4" />
            Download disabled on preview
          </span>
        )}
      </Button>
    </div>
  );
}
