import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, FileText, Clock, CheckCircle, Camera, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const { getUserIssues, getIssuesByStatus } = useIssues();
  const navigate = useNavigate();

  const myIssues = getUserIssues(user?.id || '');
  const stats = {
    total: myIssues.length,
    pending: getIssuesByStatus(user?.id || '', 'pending').length,
    progress: getIssuesByStatus(user?.id || '', ['seen', 'progress']).length,
    solved: getIssuesByStatus(user?.id || '', 'completed').length,
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="gradient-primary px-4 pt-4 pb-16">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary-foreground">My Profile</h1>
      </div>

      <div className="px-4 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center -mt-16 mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-xl font-bold text-foreground mt-4">{user?.name}</h2>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                <span>{user?.city}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 mx-auto mb-1 text-pending" />
                <p className="text-lg font-bold text-foreground">{stats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
                <p className="text-lg font-bold text-foreground">{stats.progress}</p>
                <p className="text-[10px] text-muted-foreground">Progress</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
                <p className="text-lg font-bold text-foreground">{stats.solved}</p>
                <p className="text-[10px] text-muted-foreground">Solved</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="text-sm text-foreground">{user?.city}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Logout */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
