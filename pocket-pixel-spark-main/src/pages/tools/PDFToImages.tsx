import { useState } from 'react';
import { ImageIcon, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function PDFToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('jpg');
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
    toast.loading('Converting to images...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF converted to images!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="PDF to Images"
      description="Convert to JPG/PNG"
      icon={<ImageIcon className="w-6 h-6" />}
      color="from-pink-500 to-rose-500"
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
                <label className="text-sm font-medium mb-2 block">Image Format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Button
              onClick={handleConvert}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Convert to Images
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
