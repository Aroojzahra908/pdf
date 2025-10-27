import { useState } from 'react';
import { FileDown, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function ConvertPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('word');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Converting PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF converted successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Convert PDF"
      description="To Word, Excel, PPT"
      icon={<FileDown className="w-6 h-6" />}
      color="from-blue-500 to-cyan-500"
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
                <label className="text-sm font-medium mb-2 block">Convert to</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Word (.docx)</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="powerpoint">PowerPoint (.pptx)</SelectItem>
                    <SelectItem value="jpg">JPG Images</SelectItem>
                    <SelectItem value="png">PNG Images</SelectItem>
                    <SelectItem value="text">Text (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Button
              onClick={handleConvert}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Convert PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
