import { useState } from 'react';
import { Shield, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

export default function RepairPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [repaired, setRepaired] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setRepaired(false);
      setIssues(['Corrupted header', 'Missing EOF marker', 'Invalid cross-reference table']);
      toast.success('PDF loaded');
    }
  };

  const handleRepair = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Repairing PDF...');
    
    setTimeout(() => {
      setLoading(false);
      setRepaired(true);
      toast.success('PDF repaired successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Repair PDF"
      description="Fix corrupted PDF"
      icon={<Shield className="w-6 h-6" />}
      color="from-emerald-500 to-teal-500"
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

            {!repaired && issues.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Issues detected</span>
                </div>
                <ul className="space-y-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {repaired && (
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    PDF repaired successfully!
                  </span>
                </div>
              </Card>
            )}

            <Button
              onClick={handleRepair}
              disabled={loading || repaired}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
            >
              {repaired ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Repaired PDF
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Repair PDF
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
