import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { profile, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 gradient-primary">
      <div className="flex items-center justify-between px-4 h-16">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground tracking-tight">
            CIMS
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <NotificationDropdown />
          
          <Link to="/profile">
            <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
              <AvatarImage src={profile?.avatar} alt={profile?.name} />
              <AvatarFallback className="bg-accent text-accent-foreground text-sm font-medium">
                {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
