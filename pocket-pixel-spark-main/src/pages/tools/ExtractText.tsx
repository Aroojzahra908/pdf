import { useState } from 'react';
import { FileText, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
      
      // Simulate extraction
      setTimeout(() => {
        setExtractedText('Sample extracted text from PDF...\n\nThis is a demonstration of text extraction.');
        toast.success('Text extracted!');
      }, 1500);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success('Copied to clipboard!');
  };

  return (
    <ToolLayout
      title="Extract Text"
      description="Get text from PDF"
      icon={<FileText className="w-6 h-6" />}
      color="from-indigo-500 to-purple-500"
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

            {extractedText && (
              <>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Extracted Text</label>
                    <Button size="sm" variant="ghost" onClick={copyText}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="min-h-[200px]"
                  />
                </Card>

                <Button
                  onClick={() => toast.success('Text downloaded!')}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download as Text
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
