import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Preview() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Business Plan Preview
        </h1>
        <p className="text-muted-foreground max-w-md">
          Report ID: {reportId}
        </p>
        <Button
          onClick={() => navigate('/pricing')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View Pricing
        </Button>
      </div>
    </div>
  );
}
