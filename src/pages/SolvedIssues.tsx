import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { departmentLabels } from '@/types/issue';
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';

export default function SolvedIssues() {
  const { user } = useAuth();
  const { getIssuesByStatus } = useIssues();
  const navigate = useNavigate();

  const solvedIssues = getIssuesByStatus(user?.id || '', 'completed');

  const getResolutionTime = (createdAt: Date, resolvedAt?: Date) => {
    if (!resolvedAt) return 'N/A';
    const days = differenceInDays(resolvedAt, createdAt);
    const hours = differenceInHours(resolvedAt, createdAt) % 24;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Solved Issues</h1>
            <p className="text-muted-foreground text-sm">{solvedIssues.length} issues resolved</p>
          </div>
        </div>
      </motion.div>

      {/* Issues List */}
      <div className="space-y-4">
        {solvedIssues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No solved issues yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Resolved issues will appear here
            </p>
          </div>
        ) : (
          solvedIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-success/20"
                onClick={() => navigate(`/issue/${issue.id}`)}
              >
                {/* Before/After Images */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="relative">
                    <img
                      src={issue.imageUrl}
                      alt="Before"
                      className="w-full h-24 object-cover"
                    />
                    <Badge className="absolute bottom-1 left-1 bg-pending text-pending-foreground text-[10px]">
                      Before
                    </Badge>
                  </div>
                  <div className="relative">
                    <img
                      src={issue.solvedImageUrl || issue.imageUrl}
                      alt="After"
                      className="w-full h-24 object-cover"
                    />
                    <Badge className="absolute bottom-1 left-1 bg-success text-success-foreground text-[10px]">
                      After
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {departmentLabels[issue.department]}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>

                  {/* Resolution Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Resolved</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Time: {getResolutionTime(issue.createdAt, issue.resolvedAt)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
