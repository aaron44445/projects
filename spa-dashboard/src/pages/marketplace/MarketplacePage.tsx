import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, MarketplaceProfile, MarketplaceStats } from '../../lib/api';

export default function MarketplacePage() {
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        api.getMarketplaceProfile(),
        api.getMarketplaceStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!profile) return;
    try {
      setPublishing(true);
      setError('');
      if (profile.isPublished) {
        await api.unpublishFromMarketplace();
      } else {
        await api.publishToMarketplace();
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error || 'Failed to load profile'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <div className="flex gap-3">
          <Link
            to="/marketplace/profile"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit Profile
          </Link>
          <button
            onClick={handlePublish}
            disabled={publishing || (!profile.isPublished && !profile.isReady)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              profile.isPublished
                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                : profile.isReady
                ? 'text-white bg-green-600 hover:bg-green-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            {publishing ? 'Updating...' : profile.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg ${
          profile.isPublished
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`font-semibold ${
                profile.isPublished ? 'text-green-800' : 'text-yellow-800'
              }`}
            >
              {profile.isPublished ? 'Listed on Marketplace' : 'Not Listed'}
            </h2>
            <p className={profile.isPublished ? 'text-green-600' : 'text-yellow-600'}>
              {profile.isPublished
                ? `Your spa is live at /spa/${profile.profileSlug}`
                : 'Complete the requirements below to publish'}
            </p>
          </div>
          {profile.isPublished && profile.profileSlug && (
            <a
              href={`/spa/${profile.profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 underline"
            >
              View Public Profile
            </a>
          )}
        </div>
      </div>

      {/* Requirements Checklist */}
      {!profile.isPublished && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements Checklist</h3>
          <div className="space-y-3">
            {Object.entries(profile.requirements).map(([key, met]) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    met ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {met && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className={met ? 'text-gray-700' : 'text-gray-500'}>
                  {key === 'profileSlug' && 'Profile URL slug set'}
                  {key === 'description' && 'Description added'}
                  {key === 'hasImage' && 'At least one image uploaded'}
                  {key === 'hasService' && 'At least one active service'}
                  {key === 'hasBusinessHours' && 'Business hours configured'}
                </span>
              </div>
            ))}
          </div>
          {!profile.isReady && (
            <Link
              to="/marketplace/profile"
              className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-700"
            >
              Complete your profile →
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-500">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{stats.bookings.total}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-500">Pending Bookings</div>
            <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.bookings.pending}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-500">Average Rating</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {stats.reviews.average.toFixed(1)}
              <span className="text-lg text-gray-500">/5</span>
            </div>
            <div className="text-sm text-gray-500">{stats.reviews.count} reviews</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-500">Marketplace Revenue</div>
            <div className="text-3xl font-bold text-green-600 mt-1">
              ${stats.revenue.total.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/marketplace/bookings"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Manage Bookings</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage marketplace bookings</p>
        </Link>
        <Link
          to="/marketplace/reviews"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Reviews</h3>
          <p className="text-sm text-gray-500 mt-1">View and moderate customer reviews</p>
        </Link>
        <Link
          to="/marketplace/profile"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Edit Profile</h3>
          <p className="text-sm text-gray-500 mt-1">Update your public marketplace profile</p>
        </Link>
      </div>

      {/* Recent Bookings */}
      {stats && stats.bookings.recent.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Marketplace Bookings</h3>
            <Link to="/marketplace/bookings" className="text-sm text-purple-600 hover:text-purple-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.bookings.recent.map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{booking.customerName}</div>
                  <div className="text-sm text-gray-500">
                    {booking.service.name} • {new Date(booking.dateTime).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">${Number(booking.totalPrice).toFixed(2)}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
