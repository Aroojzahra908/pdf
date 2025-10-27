import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  children: ReactNode;
}

export default function ToolLayout({ title, description, icon, color, children }: ToolLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
              {icon}
            </div>
            <div>
              <h1 className="text-lg font-bold">{title}</h1>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
