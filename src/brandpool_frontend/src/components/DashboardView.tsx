import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

interface DashboardViewProps {
  campaigns: Campaign[];
  proposals: any[];
  userProfile: any;
}

export function DashboardView({ campaigns, proposals, userProfile }: DashboardViewProps) {
  const activeCampaigns = campaigns.filter(c => !c.isCompleted);
  const activeProposals = proposals.filter(p => p.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Welcome to BrandPool - Connect brands with influencers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{activeCampaigns.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Campaigns</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{campaigns.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Active Proposals</h3>
          <p className="text-3xl font-bold text-secondary-600 mt-2">{activeProposals.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Your Campaigns</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {userProfile?.completedCampaigns.length || 0}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
          <div className="space-y-3">
            {activeCampaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id.toString()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                  <p className="text-sm text-gray-600">{campaign.payout.toString()} tokens</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  Active
                </span>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active campaigns</p>
            )}
          </div>
          <Link 
            to="/campaigns"
            className="btn-primary w-full mt-4 text-center block"
          >
            View All Campaigns
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Proposals</h3>
          <div className="space-y-3">
            {activeProposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id.toString()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                  <p className="text-sm text-gray-600">
                    {proposal.votesFor.toString()} for, {proposal.votesAgainst.toString()} against
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                  Voting
                </span>
              </div>
            ))}
            {activeProposals.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active proposals</p>
            )}
          </div>
          <Link 
            to="/governance"
            className="btn-primary w-full mt-4 text-center block"
          >
            View All Proposals
          </Link>
        </div>
      </div>
    </div>
  );
}
