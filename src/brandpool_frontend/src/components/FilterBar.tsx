
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus
}: FilterBarProps) => {
  const categories = ['All', 'Fashion', 'Tech', 'Gaming', 'Lifestyle', 'Crypto', 'NFT'];
  const statuses = ['All', 'Open', 'In Progress', 'Completed'];

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
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-cyber-gray border-gray-600 text-white placeholder-gray-400 focus:border-cyber-teal"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-400 self-center mr-2">Category:</span>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 ${
                selectedCategory === category 
                  ? 'bg-cyber-teal text-cyber-black' 
                  : 'border-gray-600 text-gray-300 hover:border-cyber-teal hover:text-cyber-teal'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
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
      </div>
    </motion.div>
  );
};

export default FilterBar;
