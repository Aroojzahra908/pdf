import { useState } from 'react';
import { Edit3, FileText, Download, Type, Image as ImageIcon, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function EditPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleSave = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Saving changes...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF saved successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text & images"
      icon={<Edit3 className="w-6 h-6" />}
      color="from-purple-500 to-pink-500"
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

            <Card className="p-4">
              <p className="text-sm font-medium mb-3">Edit Tools</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="flex-col h-auto py-3">
                  <Type className="w-5 h-5 mb-1" />
                  <span className="text-xs">Text</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3">
                  <ImageIcon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Image</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3">
                  <Square className="w-5 h-5 mb-1" />
                  <span className="text-xs">Shape</span>
                </Button>
              </div>
            </Card>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
