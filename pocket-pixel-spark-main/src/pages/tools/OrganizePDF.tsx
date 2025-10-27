import { useState } from 'react';
import { FolderSync, FileText, Download, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ToolLayout from '@/components/ToolLayout';
import { toast } from 'sonner';

interface Page {
  id: number;
  number: number;
}

export default function OrganizePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate 5 pages
      setPages([
        { id: 1, number: 1 },
        { id: 2, number: 2 },
        { id: 3, number: 3 },
        { id: 4, number: 4 },
        { id: 5, number: 5 }
      ]);
      toast.success('PDF loaded');
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
    setPages(newPages);
  };

  const moveDown = (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
    setPages(newPages);
  };

  const deletePage = (id: number) => {
    setPages(pages.filter(p => p.id !== id));
    toast.success('Page deleted');
  };

  const handleSave = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    toast.loading('Organizing PDF...');
    
    setTimeout(() => {
      setLoading(false);
      toast.success('PDF organized successfully!');
    }, 2000);
  };

  return (
    <ToolLayout
      title="Organize PDF"
      description="Reorder pages"
      icon={<FolderSync className="w-6 h-6" />}
      color="from-violet-500 to-purple-500"
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

        {file && pages.length > 0 && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{pages.length} pages</span>
              </div>
              
              <div className="space-y-2">
                {pages.map((page, index) => (
                  <div key={page.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1">Page {page.number}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => moveDown(index)}
                      disabled={index === pages.length - 1}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deletePage(page.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Organization
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
