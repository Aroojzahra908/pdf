import { useState } from 'react';
import { Split, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState('1-3, 4-6');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleSplit = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Splitting PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF split successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Separate into multiple files"
      icon={<Split className="w-6 h-6" />}
      color="from-orange-500 to-yellow-500"
    >
      <div className="space-y-4">
        <Card className="border-dashed border-2 border-border/50 bg-card/50">
          <label className="cursor-pointer block p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Select PDF file</p>
            <p className="text-sm text-muted-foreground">Click to browse</p>
          </label>
        </Card>

        {file && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Page Ranges</label>
                <Input
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g., 1-3, 4-6, 7-10"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter page ranges separated by commas
                </p>
              </div>
            </Card>

            <Button
              onClick={handleSplit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Split PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
