import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import CampaignCard from '../components/CampaignCard';
import FilterBar from '../components/FilterBar';

interface CampaignsPageProps {
  campaigns: Campaign[];
  onDataUpdate: () => void;
}

const CampaignsPage = ({ campaigns, onDataUpdate }: CampaignsPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const { userAccount, isBrand, isInfluencer } = useRoleAuth();

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.owner.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || 
                         (selectedStatus === 'Open' && !campaign.isCompleted) ||
                         (selectedStatus === 'Completed' && campaign.isCompleted);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="neuro-card p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
            <span className="cyber-text-gradient">Active</span> Campaigns
          </h1>
          <p className="text-xl text-gray-400">
            {isBrand() 
              ? 'Discover influencers and manage your campaigns' 
              : 'Find amazing partnership opportunities with top brands'
            }
          </p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        campaigns={campaigns}
      />

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neuro-card p-16 text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            No campaigns found
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedStatus !== 'All' 
              ? 'Try adjusting your search or filter criteria' 
              : 'No campaigns are currently available'
            }
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CampaignCard 
                campaign={campaign} 
                onDataUpdate={onDataUpdate}
                showActions={true}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Call to Action */}
      {isBrand() && filteredCampaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-6 text-center"
        >
          <p className="text-gray-400 mb-4">
            Want to create your own campaign?
          </p>
          <Link to="/campaigns">
            <button className="cyber-button px-6 py-3 text-cyber-black font-medium">
              Go to My Campaigns
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default CampaignsPage;
