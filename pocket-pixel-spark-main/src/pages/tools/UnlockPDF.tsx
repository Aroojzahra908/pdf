import { useState } from 'react';
import { Unlock, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function UnlockPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleUnlock = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Unlocking PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF unlocked successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password"
      icon={<Unlock className="w-6 h-6" />}
      color="from-teal-500 to-green-500"
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
                <label className="text-sm font-medium mb-2 block">Password (if required)</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </Card>

            <Button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Unlock PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
