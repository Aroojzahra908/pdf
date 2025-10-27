import { FileText, Split, Minimize2, FileDown, Edit3, ImageIcon, Lock, Unlock, RotateCw, FileSignature, Droplet, FolderSync, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

export default function Index() {
  const navigate = useNavigate();
  
  const tools: Tool[] = [
    {
      id: 'merge',
      name: 'Merge PDF',
      description: 'Combine PDFs in order',
      icon: <FileText className="w-8 h-8" />,
      color: 'from-red-500 to-orange-500',
      path: '/merge'
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Separate into multiple',
      icon: <Split className="w-8 h-8" />,
      color: 'from-orange-500 to-yellow-500',
      path: '/split'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce file size',
      icon: <Minimize2 className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      path: '/compress'
    },
    {
      id: 'convert',
      name: 'Convert PDF',
      description: 'To Word, Excel, PPT',
      icon: <FileDown className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      path: '/convert'
    },
    {
      id: 'edit',
      name: 'Edit PDF',
      description: 'Add text & images',
      icon: <Edit3 className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      path: '/edit'
    },
    {
      id: 'extract',
      name: 'Extract Text',
      description: 'Get text from PDF',
      icon: <FileText className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-500',
      path: '/extract'
    },
    {
      id: 'images',
      name: 'PDF to JPG',
      description: 'Convert to images',
      icon: <ImageIcon className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-500',
      path: '/images'
    },
    {
      id: 'rotate',
      name: 'Rotate PDF',
      description: 'Rotate pages',
      icon: <RotateCw className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      path: '/rotate'
    },
    {
      id: 'unlock',
      name: 'Unlock PDF',
      description: 'Remove password',
      icon: <Unlock className="w-8 h-8" />,
      color: 'from-teal-500 to-green-500',
      path: '/unlock'
    },
    {
      id: 'protect',
      name: 'Protect PDF',
      description: 'Add password',
      icon: <Lock className="w-8 h-8" />,
      color: 'from-red-500 to-pink-500',
      path: '/protect'
    },
    {
      id: 'sign',
      name: 'Sign PDF',
      description: 'Add signature',
      icon: <FileSignature className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-500',
      path: '/sign'
    },
    {
      id: 'watermark',
      name: 'Watermark',
      description: 'Add watermark',
      icon: <Droplet className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-500',
      path: '/watermark'
    },
    {
      id: 'organize',
      name: 'Organize',
      description: 'Reorder pages',
      icon: <FolderSync className="w-8 h-8" />,
      color: 'from-violet-500 to-purple-500',
      path: '/organize'
    },
    {
      id: 'repair',
      name: 'Repair PDF',
      description: 'Fix corrupted PDF',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-500',
      path: '/repair'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-6">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PDF Tools</h1>
              <p className="text-xs text-muted-foreground">All-in-one toolkit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Every PDF tool you need</h2>
          <p className="text-muted-foreground text-sm">
            Merge, split, compress, convert and more
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <Card 
              key={tool.id}
              className="relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-200 border-border/50"
              onClick={() => navigate(tool.path)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              <div className="relative p-4 flex flex-col items-center text-center gap-2">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center space-y-2 pb-4">
          <p className="text-sm text-muted-foreground">
            🔒 Files processed securely on your device
          </p>
        </div>
      </div>
    </div>
  );
}
