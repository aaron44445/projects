'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import {
  Menu,
  User,
  Mail,
  Phone,
  FileText,
  Award,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { api, ApiError } from '@/lib/api';
import { TOKEN_KEYS } from '@/types/auth';
import { API_CONFIG } from '@/config/api';

interface StaffProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  certifications?: string;
  avatarUrl?: string;
  role: string;
  commissionRate?: number;
  assignedServices: {
    id: string;
    name: string;
    category?: string;
  }[];
  assignedLocations: {
    id: string;
    name: string;
    address?: string;
    isPrimary: boolean;
  }[];
}

function ProfileContent() {
  const { updateProfile } = useStaffAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    certifications: '',
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<StaffProfile>('/staff-portal/profile');
      if (response.success && response.data) {
        setProfile(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          phone: response.data.phone || '',
          bio: response.data.bio || '',
          certifications: response.data.certifications || '',
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await api.patch<StaffProfile>('/staff-portal/profile', formData);
      if (response.success && response.data) {
        setProfile(response.data);
        setSuccessMessage('Profile updated successfully');
        // Also update the auth context
        await updateProfile(formData);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const response = await fetch(
        `${API_CONFIG.apiUrl}/staff-portal/profile/avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEYS.staff.access)}`,
          },
          body: uploadFormData,
        }
      );

      const data = await response.json();

      if (data.success && data.data?.avatarUrl) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: data.data.avatarUrl } : null));
        setSuccessMessage('Avatar updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error?.message || 'Failed to upload avatar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      manager: 'Manager',
      staff: 'Staff',
      receptionist: 'Receptionist',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <StaffPortalSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">My Profile</h1>
                <p className="text-sm text-charcoal/60">Manage your personal information</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
                <p className="text-charcoal/60">Loading profile...</p>
              </div>
            </div>
          )}

          {error && !isLoading && !profile && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load profile</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchProfile}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && profile && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Success/Error Messages */}
              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-rose-700">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-sm text-rose-500 hover:text-rose-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Avatar Section */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-sage/20 flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={`${profile.firstName} ${profile.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sage font-bold text-3xl">
                          {profile.firstName[0]}
                          {profile.lastName[0]}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center hover:bg-sage-dark transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-charcoal">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-charcoal/60">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-sage/20 text-sage-dark rounded-full text-sm font-medium">
                        {getRoleLabel(profile.role)}
                      </span>
                      {profile.commissionRate && (
                        <span className="px-3 py-1 bg-lavender/30 text-lavender-dark rounded-full text-sm font-medium">
                          {profile.commissionRate}% Commission
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
                  <div className="p-5 border-b border-charcoal/10">
                    <h3 className="text-lg font-semibold text-charcoal">Personal Information</h3>
                    <p className="text-sm text-charcoal/60">Update your personal details</p>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/10 bg-charcoal/5 text-charcoal/60 cursor-not-allowed"
                      />
                      <p className="text-xs text-charcoal/50 mt-1">
                        Contact your manager to change your email address
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bio: e.target.value }))
                        }
                        placeholder="Tell clients a bit about yourself..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Certifications */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        <Award className="w-4 h-4 inline mr-2" />
                        Certifications & Licenses
                      </label>
                      <textarea
                        value={formData.certifications}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, certifications: e.target.value }))
                        }
                        placeholder="List your certifications, licenses, and special training..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="p-6 border-t border-charcoal/10 bg-charcoal/5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>

              {/* Assigned Services (Read-only) */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
                <div className="p-5 border-b border-charcoal/10">
                  <h3 className="text-lg font-semibold text-charcoal">
                    <Briefcase className="w-5 h-5 inline mr-2" />
                    Assigned Services
                  </h3>
                  <p className="text-sm text-charcoal/60">
                    Services you are authorized to perform
                  </p>
                </div>

                <div className="p-6">
                  {profile.assignedServices.length === 0 ? (
                    <p className="text-charcoal/60 text-center py-4">
                      No services assigned yet. Contact your manager.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.assignedServices.map((service) => (
                        <div
                          key={service.id}
                          className="px-4 py-2 bg-charcoal/5 rounded-xl"
                        >
                          <p className="font-medium text-charcoal">{service.name}</p>
                          {service.category && (
                            <p className="text-xs text-charcoal/60">{service.category}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Locations (Read-only) */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
                <div className="p-5 border-b border-charcoal/10">
                  <h3 className="text-lg font-semibold text-charcoal">
                    <MapPin className="w-5 h-5 inline mr-2" />
                    Assigned Locations
                  </h3>
                  <p className="text-sm text-charcoal/60">
                    Locations where you are scheduled to work
                  </p>
                </div>

                <div className="p-6">
                  {profile.assignedLocations?.length === 0 ? (
                    <p className="text-charcoal/60 text-center py-4">
                      No locations assigned yet. Contact your manager.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.assignedLocations?.map((location) => (
                        <div
                          key={location.id}
                          className={`px-4 py-2 rounded-xl ${
                            location.isPrimary
                              ? 'bg-sage/20 border border-sage/30'
                              : 'bg-charcoal/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-charcoal">{location.name}</p>
                            {location.isPrimary && (
                              <span className="px-2 py-0.5 bg-sage/30 text-sage-dark rounded text-xs font-medium">
                                Primary
                              </span>
                            )}
                          </div>
                          {location.address && (
                            <p className="text-xs text-charcoal/60">{location.address}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StaffProfilePage() {
  return (
    <StaffAuthGuard>
      <ProfileContent />
    </StaffAuthGuard>
  );
}
