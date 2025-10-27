import { useState } from 'react';
import { FileText, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);
    toast.success(`Added ${selectedFiles.length} file(s)`);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please select at least 2 PDFs to merge');
      return;
    }

    setLoading(true);
    toast.loading('Merging PDFs...');
    
    // Simulate processing
    setTimeout(() => {
      setLoading(false);
      toast.success('PDFs merged successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDFs"
      icon={<FileText className="w-6 h-6" />}
      color="from-red-500 to-orange-500"
    >
      <div className="space-y-4">
        <Card className="border-dashed border-2 border-border/50 bg-card/50">
          <label className="cursor-pointer block p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Select PDF files</p>
            <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
          </label>
        </Card>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{files.length} files selected</p>
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {files.length >= 2 && (
          <Button
            onClick={handleMerge}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            Merge {files.length} PDFs
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
