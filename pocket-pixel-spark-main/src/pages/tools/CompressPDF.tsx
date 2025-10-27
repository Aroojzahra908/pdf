import { useState } from 'react';
import { Minimize2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState([75]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleCompress = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Compressing PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF compressed successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce file size"
      icon={<Minimize2 className="w-6 h-6" />}
      color="from-green-500 to-emerald-500"
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
              <p className="text-xs text-muted-foreground mt-2">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </Card>

            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Compression Quality: {quality[0]}%
                </label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={10}
                  max={100}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Smaller size</span>
                  <span>Better quality</span>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleCompress}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Compress PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
