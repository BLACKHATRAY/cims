import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IssueCard } from '@/components/issues/IssueCard';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { categoryLabels } from '@/types/issue';

export default function Dashboard() {
  const { user } = useAuth();
  const { issues } = useIssues();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter issues by city and search
  const cityIssues = issues.filter(issue => issue.city === user?.city);
  const filteredIssues = cityIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || issue.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: cityIssues.length,
    pending: cityIssues.filter(i => i.status === 'pending').length,
    progress: cityIssues.filter(i => i.status === 'progress' || i.status === 'seen').length,
    solved: cityIssues.filter(i => i.status === 'completed').length,
  };

  const categories = Object.entries(categoryLabels);

  return (
    <div className="pb-4">
      {/* Welcome Section */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-1">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm">
            Issues reported in {user?.city}
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          <div className="bg-card rounded-xl p-3 text-center border border-border/50">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border/50">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-pending" />
            <p className="text-lg font-bold text-foreground">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border/50">
            <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-lg font-bold text-foreground">{stats.progress}</p>
            <p className="text-[10px] text-muted-foreground">Progress</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border/50">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold text-foreground">{stats.solved}</p>
            <p className="text-[10px] text-muted-foreground">Solved</p>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map(([key, label]) => (
            <Badge
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Issues</h3>
          <span className="text-xs text-muted-foreground">{filteredIssues.length} issues</span>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No issues found</p>
          </div>
        ) : (
          filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <IssueCard
                issue={issue}
                onClick={() => navigate(`/issue/${issue.id}`)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
