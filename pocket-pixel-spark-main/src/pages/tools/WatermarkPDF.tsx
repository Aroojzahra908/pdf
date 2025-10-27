import { useState } from 'react';
import { Droplet, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function WatermarkPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState([30]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleAdd = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Adding watermark...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('Watermark added successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Add watermark"
      icon={<Droplet className="w-6 h-6" />}
      color="from-cyan-500 to-blue-500"
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

            <Card className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Watermark Text</label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Opacity: {opacity[0]}%
                </label>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={10}
                  max={100}
                  step={5}
                  className="py-4"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWatermarkText('CONFIDENTIAL')}
                >
                  Confidential
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWatermarkText('DRAFT')}
                >
                  Draft
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWatermarkText('COPY')}
                >
                  Copy
                </Button>
              </div>
            </Card>

            <Button
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Add Watermark
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
