import { useState } from 'react';
import { Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

interface ProfileViewProps {
  userProfile: Profile | null;
  userPrincipal: Principal | null;
  onProfileUpdate: (principal: Principal) => void;
  backendActor: any;
}

export function ProfileView({ userProfile, userPrincipal, onProfileUpdate, backendActor }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    socialLinks: userProfile?.socialLinks.join('\n') || ''
  });
  const [isLoading, setIsLoading] = useState(false);

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

  if (!userProfile && !isEditing) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Profile</h2>
        <p className="text-gray-600 mb-6">Set up your profile to start participating in campaigns</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
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
          <form onSubmit={handleSaveProfile} className="space-y-4">
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
        ) : userProfile && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {userProfile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{userProfile.username}</h3>
                <p className="text-gray-600">Completed {userProfile.completedCampaigns.length} campaigns</p>
              </div>
            </div>

            {userProfile.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600">{userProfile.bio}</p>
              </div>
            )}

            {userProfile.socialLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Social Links</h4>
                <div className="space-y-1">
                  {userProfile.socialLinks.map((link, index) => (
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

            {userProfile.completedCampaigns.length > 0 && (
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
