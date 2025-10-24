import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface BusinessPlan {
  id: number;
  business_idea: string;
  location: string;
  pdf_url: string;
  user_id: string;
  created_at: string;
}

const PDFManagementTab = () => {
  const [pdfs, setPdfs] = useState<BusinessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    businessIdea: '',
    location: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_business')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfs(data || []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const webhookUrl = 'https://n8n.aiops.ae/webhook/bpdf';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          businessIdea: formData.businessIdea,
          location: formData.location,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      toast({
        title: "Success",
        description: "PDF generation started. It will appear in the list once completed.",
      });

      setFormData({ userId: '', businessIdea: '', location: '' });
      
      // Refresh PDF list after a delay
      setTimeout(() => {
        fetchPDFs();
      }, 5000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (pdfUrl: string, businessIdea: string) => {
    window.open(pdfUrl, '_blank');
    toast({
      title: "Download Started",
      description: `Downloading PDF for ${businessIdea}`,
    });
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.business_idea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New PDF</CardTitle>
          <CardDescription>Create a new business plan PDF for a user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneratePDF} className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Enter user ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="businessIdea">Business Idea</Label>
              <Textarea
                id="businessIdea"
                value={formData.businessIdea}
                onChange={(e) => setFormData({ ...formData, businessIdea: e.target.value })}
                placeholder="Enter business idea"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
                required
              />
            </div>
            <Button type="submit" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated PDFs</CardTitle>
          <CardDescription>View and download all business plan PDFs</CardDescription>
          <Input
            placeholder="Search by business idea, location, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Idea</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPdfs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No PDFs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPdfs.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell className="max-w-xs truncate">{pdf.business_idea}</TableCell>
                      <TableCell>{pdf.location}</TableCell>
                      <TableCell className="font-mono text-sm">{pdf.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>{format(new Date(pdf.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(pdf.pdf_url, pdf.business_idea)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFManagementTab;
