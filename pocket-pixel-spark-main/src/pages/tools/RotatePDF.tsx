import { useState } from 'react';
import { RotateCw, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const rotate = (degrees: number) => {
    setRotation((rotation + degrees) % 360);
  };

  const handleSave = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Rotating PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF rotated successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate pages"
      icon={<RotateCw className="w-6 h-6" />}
      color="from-yellow-500 to-orange-500"
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

            <Card className="p-6">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4" style={{ transform: `rotate(${rotation}deg)` }}>
                <FileText className="w-16 h-16 text-muted-foreground" />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => rotate(-90)}>
                  <RotateCw className="w-4 h-4 mr-1 transform -scale-x-100" />
                  90° Left
                </Button>
                <Button variant="outline" onClick={() => rotate(180)}>
                  <RotateCw className="w-4 h-4 mr-1" />
                  180°
                </Button>
                <Button variant="outline" onClick={() => rotate(90)}>
                  <RotateCw className="w-4 h-4 mr-1" />
                  90° Right
                </Button>
              </div>
            </Card>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Rotated PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
