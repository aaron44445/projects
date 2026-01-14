'use client';

import { useState } from 'react';
import {
  Users,
  Bell,
  Menu,
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  Package,
  RefreshCw,
  MoreHorizontal,
  Check,
  X,
  Trash2,
  Edit,
  Eye,
  Pause,
  Play,
  Loader2,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { AppSidebar } from '@/components/AppSidebar';
import { usePackages, Package as PackageType, PackageMember } from '@/hooks';
import { useServices } from '@/hooks/useServices';

export default function PackagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('packages');
  const [showModal, setShowModal] = useState<'package' | 'membership' | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingItem, setEditingItem] = useState<PackageType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const { packages, members, loading, error, fetchPackages, fetchMembers, createPackage, updatePackage, deletePackage, updateMember, cancelMembership } = usePackages();
  const { services: servicesList, isLoading: servicesLoading } = useServices();

  // View details modal state
  const [viewingItem, setViewingItem] = useState<PackageType | null>(null);
  const [viewingMember, setViewingMember] = useState<PackageMember | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    services: 3,
    validityDays: 365,
    selectedServices: [] as string[],
    discount: '15',
  });

  // Separate packages and memberships
  const packageItems = packages.filter(p => p.type === 'PACKAGE' || p.type === 'package');
  const membershipItems = packages.filter(p => p.type === 'MEMBERSHIP' || p.type === 'membership');
  const activeMembers = members.filter(m => m.isActive);

  // Calculate stats
  const monthlyRevenue = membershipItems.reduce((sum, p) => {
    const memberCount = members.filter(m => m.package.name === p.name && m.isActive).length;
    return sum + (p.renewalPrice || p.price) * memberCount;
  }, 0);

  const retentionRate = members.length > 0
    ? Math.round((activeMembers.length / members.length) * 100)
    : 0;

  const stats = [
    { label: 'Active Members', value: activeMembers.length.toString(), icon: Users, color: 'bg-sage' },
    { label: 'Monthly Revenue', value: `$${(monthlyRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'bg-lavender' },
    { label: 'Packages Sold', value: packageItems.length.toString(), icon: Package, color: 'bg-peach' },
    { label: 'Retention Rate', value: `${retentionRate}%`, icon: TrendingUp, color: 'bg-mint' },
  ];

  const handleCreatePackage = async () => {
    if (!formData.name || !formData.price) return;

    setIsSubmitting(true);
    try {
      const type = showModal === 'package' ? 'PACKAGE' : 'MEMBERSHIP';
      const newPackage = await createPackage({
        name: formData.name,
        description: formData.description || undefined,
        price: parseInt(formData.price),
        type,
        durationDays: showModal === 'package' ? formData.validityDays : undefined,
        renewalPrice: showModal === 'membership' ? parseInt(formData.price) : undefined,
      });

      if (newPackage) {
        setShowModal(null);
        resetForm();
        showSuccess(`${showModal === 'package' ? 'Package' : 'Membership'} created successfully!`);
      }
    } catch (err) {
      showSuccess('Failed to create. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await deletePackage(id);
      setActionMenu(null);
      showSuccess('Package deleted');
    } catch (err) {
      showSuccess('Failed to delete package');
    }
  };

  const handleToggleStatus = async (pkg: PackageType) => {
    try {
      await updatePackage(pkg.id, { isActive: !pkg.isActive });
      setActionMenu(null);
      showSuccess(`${pkg.name} ${pkg.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      showSuccess('Failed to update status');
    }
  };

  const handleViewDetails = (pkg: PackageType) => {
    setViewingItem(pkg);
    setActionMenu(null);
  };

  const handleEdit = (pkg: PackageType) => {
    setEditingItem(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      services: pkg.packageServices?.reduce((sum, s) => sum + s.quantity, 0) || 3,
      validityDays: pkg.durationDays || 365,
      selectedServices: pkg.packageServices?.map(s => s.service.name) || [],
      discount: '15',
    });
    setShowModal(pkg.type === 'PACKAGE' || pkg.type === 'package' ? 'package' : 'membership');
    setActionMenu(null);
  };

  const handleUpdatePackage = async () => {
    if (!editingItem || !formData.name || !formData.price) return;

    setIsSubmitting(true);
    try {
      await updatePackage(editingItem.id, {
        name: formData.name,
        description: formData.description || undefined,
        price: parseInt(formData.price),
        durationDays: showModal === 'package' ? formData.validityDays : undefined,
        renewalPrice: showModal === 'membership' ? parseInt(formData.price) : undefined,
      });
      setShowModal(null);
      resetForm();
      showSuccess(`${showModal === 'package' ? 'Package' : 'Membership'} updated successfully!`);
    } catch (err) {
      showSuccess('Failed to update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseMember = async (member: PackageMember) => {
    try {
      await updateMember(member.id, { isActive: !member.isActive });
      setActionMenu(null);
      showSuccess(`Membership ${member.isActive ? 'paused' : 'resumed'}`);
    } catch (err) {
      showSuccess('Failed to update member status');
    }
  };

  const handleCancelMember = async (member: PackageMember) => {
    try {
      await cancelMembership(member.id);
      setActionMenu(null);
      showSuccess('Membership cancelled');
    } catch (err) {
      showSuccess('Failed to cancel membership');
    }
  };

  const handleViewMemberProfile = (member: PackageMember) => {
    setViewingMember(member);
    setActionMenu(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      services: 3,
      validityDays: 365,
      selectedServices: [],
      discount: '15',
    });
    setEditingItem(null);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex">
        <AppSidebar currentPage="packages" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
            <p className="text-charcoal/60">Loading packages...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream flex">
        <AppSidebar currentPage="packages" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-soft max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-charcoal mb-2">Failed to load packages</h2>
            <p className="text-charcoal/60 mb-4">{error}</p>
            <button
              onClick={() => { fetchPackages(); fetchMembers(); }}
              className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar currentPage="packages" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal">Packages & Memberships</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-charcoal/60 hover:text-charcoal relative">
                <Bell className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowModal(activeTab === 'memberships' ? 'membership' : 'package')}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {activeTab === 'memberships' ? 'Create Membership' : 'Create Package'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <FeatureGate feature="memberships">
            {/* Success Message */}
            {successMessage && (
              <div className="fixed top-6 right-6 bg-sage text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
                <Check className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-2xl p-6 border border-charcoal/5 shadow-soft">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-charcoal mb-1">{stat.value}</p>
                    <p className="text-sm text-charcoal/60">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20 mb-6">
              <h3 className="font-semibold text-charcoal mb-2">Package & Membership Tips</h3>
              <ul className="text-sm text-charcoal/70 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span><strong>Packages</strong> are one-time purchases with a set number of services</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span><strong>Memberships</strong> bill monthly and renew automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Offer 15-30% savings to encourage upfront commitment</span>
                </li>
              </ul>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-charcoal/5 shadow-soft mb-6">
              <div className="border-b border-charcoal/10 px-6">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`py-4 border-b-2 font-medium transition-colors ${activeTab === 'packages' ? 'border-sage text-sage' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Packages ({packageItems.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('memberships')}
                    className={`py-4 border-b-2 font-medium transition-colors ${activeTab === 'memberships' ? 'border-sage text-sage' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Memberships ({membershipItems.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`py-4 border-b-2 font-medium transition-colors ${activeTab === 'members' ? 'border-sage text-sage' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Members ({members.length})
                    </span>
                  </button>
                </div>
              </div>

              {activeTab === 'packages' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packageItems.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                      <Package className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                      <p className="text-charcoal/60 mb-4">No packages yet</p>
                      <button
                        onClick={() => setShowModal('package')}
                        className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark"
                      >
                        Create Your First Package
                      </button>
                    </div>
                  ) : (
                    packageItems.map((pkg) => (
                      <div key={pkg.id} className="border border-charcoal/10 rounded-xl p-5 hover:border-sage/30 transition-all relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-sage" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pkg.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-charcoal/60'
                            }`}>
                              {pkg.isActive ? 'active' : 'inactive'}
                            </span>
                            <button
                              onClick={() => setActionMenu(actionMenu === pkg.id ? null : pkg.id)}
                              className="p-1 text-charcoal/40 hover:text-charcoal"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {actionMenu === pkg.id && (
                          <div className="absolute right-4 top-14 w-40 bg-white rounded-xl shadow-lg border border-charcoal/10 py-2 z-10">
                            <button
                              onClick={() => handleViewDetails(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View details
                            </button>
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              {pkg.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              {pkg.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}

                        <h3 className="font-semibold text-charcoal mb-1">{pkg.name}</h3>
                        <p className="text-2xl font-bold text-charcoal mb-2">${pkg.price}</p>
                        {pkg.description && (
                          <p className="text-sm text-charcoal/60 mb-2">{pkg.description}</p>
                        )}
                        {pkg.packageServices && pkg.packageServices.length > 0 && (
                          <p className="text-sm text-charcoal/60 mb-3">
                            {pkg.packageServices.reduce((sum, s) => sum + s.quantity, 0)} services included
                          </p>
                        )}
                        {pkg.durationDays && (
                          <p className="text-xs text-charcoal/50 mb-3">Valid for {pkg.durationDays} days</p>
                        )}
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setShowModal('package')}
                    className="border-2 border-dashed border-charcoal/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-sage/40 transition-colors min-h-[200px]"
                  >
                    <Plus className="w-8 h-8 text-charcoal/40" />
                    <span className="text-charcoal/60 font-medium">Create Package</span>
                  </button>
                </div>
              )}

              {activeTab === 'memberships' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membershipItems.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                      <RefreshCw className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                      <p className="text-charcoal/60 mb-4">No memberships yet</p>
                      <button
                        onClick={() => setShowModal('membership')}
                        className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark"
                      >
                        Create Your First Membership
                      </button>
                    </div>
                  ) : (
                    membershipItems.map((pkg) => (
                      <div key={pkg.id} className="border border-charcoal/10 rounded-xl p-5 hover:border-sage/30 transition-all relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-lavender/20 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-lavender-dark" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pkg.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-charcoal/60'
                            }`}>
                              {pkg.isActive ? 'active' : 'inactive'}
                            </span>
                            <button
                              onClick={() => setActionMenu(actionMenu === pkg.id ? null : pkg.id)}
                              className="p-1 text-charcoal/40 hover:text-charcoal"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {actionMenu === pkg.id && (
                          <div className="absolute right-4 top-14 w-40 bg-white rounded-xl shadow-lg border border-charcoal/10 py-2 z-10">
                            <button
                              onClick={() => handleViewDetails(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View details
                            </button>
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(pkg)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              {pkg.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              {pkg.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}

                        <h3 className="font-semibold text-charcoal mb-1">{pkg.name}</h3>
                        <p className="text-2xl font-bold text-charcoal mb-2">
                          ${pkg.renewalPrice || pkg.price}<span className="text-sm font-normal text-charcoal/60">/mo</span>
                        </p>
                        {pkg.description && (
                          <p className="text-sm text-charcoal/60 mb-2">{pkg.description}</p>
                        )}
                        {pkg.packageServices && pkg.packageServices.length > 0 && (
                          <p className="text-sm text-charcoal/60 mb-3">
                            {pkg.packageServices.reduce((sum, s) => sum + s.quantity, 0)} services per month
                          </p>
                        )}
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setShowModal('membership')}
                    className="border-2 border-dashed border-charcoal/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-sage/40 transition-colors min-h-[200px]"
                  >
                    <Plus className="w-8 h-8 text-charcoal/40" />
                    <span className="text-charcoal/60 font-medium">Create Membership</span>
                  </button>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="divide-y divide-charcoal/10">
                  {members.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                      <p className="text-charcoal/60">No members yet</p>
                      <p className="text-sm text-charcoal/40 mt-2">Members will appear here when clients purchase packages or memberships</p>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-cream/50 transition-colors relative">
                        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                          <span className="text-sage font-semibold">
                            {member.client.firstName[0]}{member.client.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal">
                            {member.client.firstName} {member.client.lastName}
                          </p>
                          <p className="text-sm text-charcoal/60">{member.package.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-charcoal">
                            {member.servicesRemaining}/{member.totalServices} services remaining
                          </p>
                          {member.expirationDate && (
                            <p className="text-xs text-charcoal/50">
                              Expires: {formatDate(member.expirationDate)}
                            </p>
                          )}
                          <span className={`text-xs flex items-center gap-1 justify-end ${
                            member.isActive ? 'text-sage-dark' : 'text-red-600'
                          }`}>
                            {member.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          onClick={() => setActionMenu(actionMenu === member.id ? null : member.id)}
                          className="p-2 text-charcoal/40 hover:text-charcoal"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {actionMenu === member.id && (
                          <div className="absolute right-12 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-charcoal/10 py-2 z-10">
                            <button
                              onClick={() => handleViewMemberProfile(member)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View profile
                            </button>
                            <button
                              onClick={() => handlePauseMember(member)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                            >
                              {member.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              {member.isActive ? 'Pause' : 'Resume'} membership
                            </button>
                            <button
                              onClick={() => handleCancelMember(member)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2 text-red-600"
                            >
                              <X className="w-4 h-4" />
                              Cancel membership
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </FeatureGate>
        </div>
      </main>

      {/* Create/Edit Package/Membership Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-charcoal">
                {editingItem ? 'Edit' : 'Create'} {showModal === 'package' ? 'Package' : 'Membership'}
              </h2>
              <button onClick={() => { setShowModal(null); resetForm(); }} className="p-2 hover:bg-charcoal/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {showModal === 'package' ? 'Package' : 'Membership'} Name
                </label>
                <input
                  type="text"
                  placeholder={showModal === 'package' ? 'e.g., Haircut Bundle' : 'e.g., VIP Monthly'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
                <textarea
                  placeholder="Brief description of what's included..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage resize-none"
                />
              </div>

              {/* Number of Services */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Number of Services {showModal === 'membership' && 'per Month'}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, services: Math.max(1, formData.services - 1) })}
                    className="w-10 h-10 rounded-lg border border-charcoal/20 flex items-center justify-center hover:border-sage transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-charcoal w-16 text-center">{formData.services}</span>
                  <button
                    onClick={() => setFormData({ ...formData, services: formData.services + 1 })}
                    className="w-10 h-10 rounded-lg border border-charcoal/20 flex items-center justify-center hover:border-sage transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Price {showModal === 'membership' && '(per month)'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Savings Percentage</label>
                <div className="grid grid-cols-4 gap-2">
                  {['10', '15', '20', '25', '30'].map((discount) => (
                    <button
                      key={discount}
                      onClick={() => setFormData({ ...formData, discount })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.discount === discount
                          ? 'bg-sage text-white'
                          : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                      }`}
                    >
                      {discount}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Validity (for packages only) */}
              {showModal === 'package' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Validity Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ days: 90, label: '3 months' }, { days: 180, label: '6 months' }, { days: 365, label: '1 year' }].map((option) => (
                      <button
                        key={option.days}
                        onClick={() => setFormData({ ...formData, validityDays: option.days })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.validityDays === option.days
                            ? 'bg-sage text-white'
                            : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Applicable Services (optional)</label>
                <p className="text-xs text-charcoal/50 mb-3">Leave empty to allow any service</p>
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-sage" />
                    <span className="ml-2 text-sm text-charcoal/60">Loading services...</span>
                  </div>
                ) : servicesList.length === 0 ? (
                  <p className="text-sm text-charcoal/60 py-4">No services available. Please add services first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {servicesList.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          const selected = formData.selectedServices.includes(service.name)
                            ? formData.selectedServices.filter(s => s !== service.name)
                            : [...formData.selectedServices, service.name];
                          setFormData({ ...formData, selectedServices: selected });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          formData.selectedServices.includes(service.name)
                            ? 'bg-sage text-white'
                            : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                        }`}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => { setShowModal(null); resetForm(); }}
                className="px-6 py-2 text-charcoal/60 hover:text-charcoal font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdatePackage : handleCreatePackage}
                disabled={!formData.name || !formData.price || isSubmitting}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showModal === 'package' ? (
                  <Package className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {editingItem ? 'Save Changes' : `Create ${showModal === 'package' ? 'Package' : 'Membership'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-charcoal">
                {viewingItem.type === 'PACKAGE' || viewingItem.type === 'package' ? 'Package' : 'Membership'} Details
              </h2>
              <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-charcoal/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header with icon and status */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  viewingItem.type === 'PACKAGE' || viewingItem.type === 'package' ? 'bg-sage/20' : 'bg-lavender/20'
                }`}>
                  {viewingItem.type === 'PACKAGE' || viewingItem.type === 'package' ? (
                    <Package className="w-7 h-7 text-sage" />
                  ) : (
                    <RefreshCw className="w-7 h-7 text-lavender-dark" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-charcoal">{viewingItem.name}</h3>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                    viewingItem.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-charcoal/60'
                  }`}>
                    {viewingItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-cream rounded-xl p-4">
                <p className="text-sm text-charcoal/60 mb-1">Price</p>
                <p className="text-3xl font-bold text-charcoal">
                  ${viewingItem.renewalPrice || viewingItem.price}
                  {(viewingItem.type === 'MEMBERSHIP' || viewingItem.type === 'membership') && (
                    <span className="text-base font-normal text-charcoal/60">/month</span>
                  )}
                </p>
              </div>

              {/* Description */}
              {viewingItem.description && (
                <div>
                  <p className="text-sm font-medium text-charcoal mb-2">Description</p>
                  <p className="text-charcoal/70">{viewingItem.description}</p>
                </div>
              )}

              {/* Duration (for packages) */}
              {viewingItem.durationDays && (
                <div className="flex items-center gap-3 p-4 bg-peach/10 rounded-xl">
                  <div className="w-10 h-10 bg-peach/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-peach-dark" />
                  </div>
                  <div>
                    <p className="text-sm text-charcoal/60">Validity Period</p>
                    <p className="font-semibold text-charcoal">{viewingItem.durationDays} days</p>
                  </div>
                </div>
              )}

              {/* Included Services */}
              {viewingItem.packageServices && viewingItem.packageServices.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-charcoal mb-3">Included Services</p>
                  <div className="space-y-2">
                    {viewingItem.packageServices.map((ps) => (
                      <div key={ps.id} className="flex items-center justify-between p-3 bg-charcoal/5 rounded-xl">
                        <span className="font-medium text-charcoal">{ps.service.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-charcoal/60">${ps.service.price} each</span>
                          <span className="px-2 py-1 bg-sage/20 text-sage-dark text-xs font-medium rounded">
                            x{ps.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-charcoal/60">
                    Total services: {viewingItem.packageServices.reduce((sum, s) => sum + s.quantity, 0)}
                  </p>
                </div>
              )}

              {/* Members using this package/membership */}
              {(() => {
                const packageMembers = members.filter(m => m.package.name === viewingItem.name);
                if (packageMembers.length === 0) return null;
                return (
                  <div>
                    <p className="text-sm font-medium text-charcoal mb-3">
                      Active Members ({packageMembers.filter(m => m.isActive).length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {packageMembers.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
                            <span className="text-sage text-sm font-semibold">
                              {member.client.firstName[0]}{member.client.lastName[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-charcoal text-sm">
                              {member.client.firstName} {member.client.lastName}
                            </p>
                            <p className="text-xs text-charcoal/60">
                              {member.servicesRemaining}/{member.totalServices} services remaining
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            member.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-charcoal/60'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                      {packageMembers.length > 5 && (
                        <p className="text-sm text-charcoal/60 text-center py-2">
                          +{packageMembers.length - 5} more members
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setViewingItem(null)}
                className="px-6 py-2 text-charcoal/60 hover:text-charcoal font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(viewingItem);
                  setViewingItem(null);
                }}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Member Profile Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-charcoal">Member Profile</h2>
              <button onClick={() => setViewingMember(null)} className="p-2 hover:bg-charcoal/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
                  <span className="text-sage text-xl font-bold">
                    {viewingMember.client.firstName[0]}{viewingMember.client.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal">
                    {viewingMember.client.firstName} {viewingMember.client.lastName}
                  </h3>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                    viewingMember.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-charcoal/60'
                  }`}>
                    {viewingMember.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                {viewingMember.client.email && (
                  <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                    <div className="w-8 h-8 bg-sage/20 rounded-lg flex items-center justify-center">
                      <span className="text-sage text-sm">@</span>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal/60">Email</p>
                      <p className="font-medium text-charcoal">{viewingMember.client.email}</p>
                    </div>
                  </div>
                )}
                {viewingMember.client.phone && (
                  <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                    <div className="w-8 h-8 bg-lavender/20 rounded-lg flex items-center justify-center">
                      <span className="text-lavender-dark text-sm">P</span>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal/60">Phone</p>
                      <p className="font-medium text-charcoal">{viewingMember.client.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package/Membership Info */}
              <div className="bg-cream rounded-xl p-4">
                <p className="text-sm text-charcoal/60 mb-2">Current Package/Membership</p>
                <p className="font-bold text-charcoal text-lg">{viewingMember.package.name}</p>
                <p className="text-charcoal/70">${viewingMember.package.price}</p>
              </div>

              {/* Services */}
              <div className="bg-sage/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-charcoal/60">Services Remaining</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    viewingMember.servicesRemaining > 2 ? 'bg-sage/20 text-sage-dark' : 'bg-peach/20 text-peach-dark'
                  }`}>
                    {viewingMember.servicesRemaining}/{viewingMember.totalServices}
                  </span>
                </div>
                <div className="w-full bg-charcoal/10 rounded-full h-2">
                  <div
                    className="bg-sage h-2 rounded-full transition-all"
                    style={{ width: `${(viewingMember.servicesRemaining / viewingMember.totalServices) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-charcoal/5 rounded-xl">
                  <p className="text-xs text-charcoal/60">Purchase Date</p>
                  <p className="font-medium text-charcoal">{formatDate(viewingMember.purchaseDate)}</p>
                </div>
                {viewingMember.expirationDate && (
                  <div className="p-3 bg-charcoal/5 rounded-xl">
                    <p className="text-xs text-charcoal/60">Expires</p>
                    <p className="font-medium text-charcoal">{formatDate(viewingMember.expirationDate)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3 justify-between sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  handlePauseMember(viewingMember);
                  setViewingMember(null);
                }}
                className="px-4 py-2 text-charcoal/60 hover:text-charcoal font-medium flex items-center gap-2"
              >
                {viewingMember.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {viewingMember.isActive ? 'Pause' : 'Resume'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewingMember(null)}
                  className="px-6 py-2 text-charcoal/60 hover:text-charcoal font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}
