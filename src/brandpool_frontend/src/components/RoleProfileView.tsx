import { useState, useEffect } from 'react';
import { Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';
import { useRoleAuth, getBrandInfo, getInfluencerInfo, getProfile } from '../hooks/useRoleAuth';

interface RoleProfileViewProps {
  userProfile: Profile | null;
  userPrincipal: Principal | null;
  onProfileUpdate: (principal: Principal) => void;
  backendActor: any;
}

export function RoleProfileView({ userProfile, userPrincipal, onProfileUpdate, backendActor }: RoleProfileViewProps) {
  const { userAccount, isBrand, isInfluencer, loading } = useRoleAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    socialLinks: userProfile?.socialLinks.join('\n') || ''
  });
  const [roleSpecificData, setRoleSpecificData] = useState({
    // Brand-specific fields
    companyName: '',
    industry: '',
    website: '',
    // Influencer-specific fields
    followerCount: '',
    engagementRate: '',
    categories: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load role-specific data when userAccount is available
  useEffect(() => {
    if (userAccount) {
      const brandInfo = getBrandInfo(userAccount);
      const influencerInfo = getInfluencerInfo(userAccount);
      
      if (isBrand() && brandInfo) {
        setRoleSpecificData(prev => ({
          ...prev,
          companyName: brandInfo.companyName || '',
          industry: brandInfo.industry || '',
          website: brandInfo.website || ''
        }));
      } else if (isInfluencer() && influencerInfo) {
        setRoleSpecificData(prev => ({
          ...prev,
          followerCount: influencerInfo.followerCount?.toString() || '',
          engagementRate: influencerInfo.engagementRate?.toString() || '',
          categories: influencerInfo.contentCategories || []
        }));
      }
    }
  }, [userAccount, isBrand, isInfluencer]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const profileInput = {
        username: profileData.username,
        bio: profileData.bio,
        socialLinks: profileData.socialLinks.split('\n').filter(link => link.trim())
      };

      const result = userProfile 
        ? await backendActor.updateProfile(profileInput)
        : await backendActor.registerProfile(profileInput);

      if ('ok' in result) {
        // If we have role-specific data to update, do that too
        if (isBrand() && (roleSpecificData.companyName || roleSpecificData.industry || roleSpecificData.website)) {
          const brandInfo = {
            companyName: roleSpecificData.companyName,
            industry: roleSpecificData.industry,
            website: roleSpecificData.website,
            verificationStatus: { pending: null } // Default to pending
          };
          await backendActor.updateBrandInfo(brandInfo);
        } else if (isInfluencer() && (roleSpecificData.followerCount || roleSpecificData.engagementRate || roleSpecificData.categories.length > 0)) {
          const influencerInfo = {
            followerCount: BigInt(parseInt(roleSpecificData.followerCount) || 0),
            engagementRate: parseFloat(roleSpecificData.engagementRate) || 0,
            categories: roleSpecificData.categories,
            verificationStatus: { pending: null } // Default to pending
          };
          await backendActor.updateInfluencerInfo(influencerInfo);
        }

        setIsEditing(false);
        onProfileUpdate(userPrincipal);
      } else {
        alert('Error saving profile: ' + result.err);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setRoleSpecificData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const availableCategories = [
    'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 
    'Lifestyle', 'Business', 'Education', 'Entertainment', 'Sports'
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile && !isEditing) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6">
          Set up your {isBrand() ? 'brand' : 'influencer'} profile to start participating in campaigns
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="btn-primary"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            {userAccount && (
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                isBrand() ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {isBrand() ? 'Brand Account' : 'Influencer Account'}
              </span>
            )}
          </div>
          {userProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Basic Profile Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Social Links (one per line)</label>
                <textarea
                  value={profileData.socialLinks}
                  onChange={(e) => setProfileData({...profileData, socialLinks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="https://twitter.com/username&#10;https://instagram.com/username"
                />
              </div>
            </div>

            {/* Role-specific Information */}
            {isBrand() && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Brand Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={roleSpecificData.companyName}
                    onChange={(e) => setRoleSpecificData({...roleSpecificData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={roleSpecificData.industry}
                    onChange={(e) => setRoleSpecificData({...roleSpecificData, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={roleSpecificData.website}
                    onChange={(e) => setRoleSpecificData({...roleSpecificData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            )}

            {isInfluencer() && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Influencer Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follower Count</label>
                  <input
                    type="number"
                    value={roleSpecificData.followerCount}
                    onChange={(e) => setRoleSpecificData({...roleSpecificData, followerCount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="10000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={roleSpecificData.engagementRate}
                    onChange={(e) => setRoleSpecificData({...roleSpecificData, engagementRate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="3.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Categories</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleSpecificData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (userProfile || userAccount) && (
          <div className="space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isBrand() ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                <span className="text-white text-xl font-bold">
                  {(userProfile?.username || (userAccount && (userAccount && getProfile(userAccount)?.username)) || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {userProfile?.username || (userAccount && (userAccount && getProfile(userAccount)?.username)) || 'User'}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600">
                    Completed {userProfile?.completedCampaigns?.length || 0} campaigns
                  </p>
                  {userAccount && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isBrand() ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {isBrand() ? 'Brand' : 'Influencer'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {(userProfile?.bio || (userAccount && getProfile(userAccount)?.bio)) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600">{userProfile?.bio || (userAccount && getProfile(userAccount)?.bio)}</p>
              </div>
            )}

            {/* Social Links */}
            {(userProfile?.socialLinks && userProfile.socialLinks.length > 0) || ((userAccount && getProfile(userAccount)?.socialLinks) && getProfile(userAccount)!.socialLinks.length > 0) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Social Links</h4>
                <div className="space-y-1">
                  {(userProfile?.socialLinks || (userAccount && getProfile(userAccount)?.socialLinks) || []).map((link: string, index: number) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 block"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Role-specific Information Display */}
            {isBrand() && userAccount && getBrandInfo(userAccount) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Brand Information</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  {getBrandInfo(userAccount)!.companyName && (
                    <p><span className="font-medium">Company:</span> {getBrandInfo(userAccount)!.companyName}</p>
                  )}
                  {getBrandInfo(userAccount)!.industry && (
                    <p><span className="font-medium">Industry:</span> {getBrandInfo(userAccount)!.industry}</p>
                  )}
                  {getBrandInfo(userAccount)!.website && (
                    <p>
                      <span className="font-medium">Website:</span> 
                      <a href={getBrandInfo(userAccount)!.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 ml-1">
                        {getBrandInfo(userAccount)!.website}
                      </a>
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Verification Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      'Verified' in getBrandInfo(userAccount)!.verificationStatus ? 'bg-green-100 text-green-800' :
                      'Rejected' in getBrandInfo(userAccount)!.verificationStatus ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {'Verified' in getBrandInfo(userAccount)!.verificationStatus ? 'Verified' :
                       'Rejected' in getBrandInfo(userAccount)!.verificationStatus ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isInfluencer() && userAccount && getInfluencerInfo(userAccount) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Influencer Information</h4>
                <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                  {/* {(userAccount && getInfluencerInfo(userAccount)!.followerCount) && (
                    <p><span className="font-medium">Followers:</span> {(userAccount && getInfluencerInfo(userAccount)!.followerCount).toString()}</p>
                  )} */}
                  {(userAccount && getInfluencerInfo(userAccount)!.engagementRate) && (
                    <p><span className="font-medium">Engagement Rate:</span> {(userAccount && getInfluencerInfo(userAccount)!.engagementRate)}%</p>
                  )}
                  {(userAccount && getInfluencerInfo(userAccount)!.contentCategories) && (userAccount && getInfluencerInfo(userAccount)!.contentCategories).length > 0 && (
                    <div>
                      <span className="font-medium">Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(userAccount && getInfluencerInfo(userAccount)!.contentCategories).map((category: string, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Verification Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      'Verified' in (getInfluencerInfo(userAccount)!.verificationStatus) ? 'bg-green-100 text-green-800' :
                      'Rejected' in (getInfluencerInfo(userAccount)!.verificationStatus) ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {'Verified' in (getInfluencerInfo(userAccount)!.verificationStatus) ? 'Verified' :
                       'Rejected' in (getInfluencerInfo(userAccount)!.verificationStatus) ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Campaigns */}
            {userProfile?.completedCampaigns && userProfile.completedCampaigns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Completed Campaigns</h4>
                <div className="space-y-2">
                  {userProfile.completedCampaigns.map((campaignId) => (
                    <div key={campaignId.toString()} className="p-2 bg-gray-50 rounded">
                      Campaign ID: {campaignId.toString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
