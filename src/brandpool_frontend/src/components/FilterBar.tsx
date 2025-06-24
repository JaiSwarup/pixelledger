
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  campaigns: Campaign[];
}

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  campaigns
}: FilterBarProps) => {
  const statuses = ['All', 'Open', 'Completed'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neuro-card p-6 mb-8"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search campaigns by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-cyber-gray border-gray-600 text-white placeholder-gray-400 focus:border-cyber-teal"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-400 self-center mr-2">Status:</span>
          {statuses.map((status) => (
            <Badge
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 ${
                selectedStatus === status 
                  ? 'bg-cyber-pink text-white' 
                  : 'border-gray-600 text-gray-300 hover:border-cyber-pink hover:text-cyber-pink'
              }`}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>

        {/* Campaign Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Total: {campaigns.length}</span>
          <span>Open: {campaigns.filter(c => !c.isCompleted).length}</span>
          <span>Completed: {campaigns.filter(c => c.isCompleted).length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
