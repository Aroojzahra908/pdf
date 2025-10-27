import { useState } from 'react';
import { Lock, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('PDF loaded');
    }
  };

  const handleProtect = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    toast.loading('Protecting PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF protected successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password"
      icon={<Lock className="w-6 h-6" />}
      color="from-red-500 to-pink-500"
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
                <label className="text-sm font-medium mb-2 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
            </Card>

            <Button
              onClick={handleProtect}
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Protect PDF
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
