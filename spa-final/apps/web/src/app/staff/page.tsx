'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Menu,
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  X,
  ChevronRight,
  Edit2,
  Clock,
  Star,
  DollarSign,
  CalendarCheck,
  Briefcase,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { useStaff, useServices, type StaffMember, type CreateStaffInput, type UpdateStaffInput } from '@/hooks';

const statusColors: Record<string, string> = {
  active: 'bg-sage/20 text-sage-dark border border-sage/30',
  inactive: 'bg-charcoal/10 text-charcoal/60 border border-charcoal/20',
  'on-leave': 'bg-amber-100 text-amber-700 border border-amber-200',
};

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
};

export default function StaffPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showNewStaff, setShowNewStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedWorkingDays, setSelectedWorkingDays] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    role: string;
    status: string;
    department: string;
  }>({
    role: '',
    status: '',
    department: '',
  });

  // Form state for staff modal
  const [staffForm, setStaffForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'owner' | 'admin' | 'staff';
    certifications: string;
    commissionRate: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    certifications: '',
    commissionRate: '',
  });

  const {
    staff,
    isLoading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    refetch,
  } = useStaff();

  const { services } = useServices();

  const filteredStaff = useMemo(() => {
    let result = staff;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (member) =>
          member.firstName.toLowerCase().includes(query) ||
          member.lastName.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (filters.role) {
      result = result.filter((member) => member.role === filters.role);
    }

    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      result = result.filter((member) => member.isActive === isActive);
    }

    // Apply department filter (based on certifications/specialties as proxy for department)
    if (filters.department) {
      result = result.filter((member) => {
        const staffServiceIds = member.staffServices?.map((s) => s.serviceId) || [];
        const staffServicesNames = services
          .filter((s) => staffServiceIds.includes(s.id))
          .map((s) => (typeof s.category === 'string' ? s.category : s.category?.name) || s.name);
        return staffServicesNames.some((name) =>
          name.toLowerCase().includes(filters.department.toLowerCase())
        );
      });
    }

    return result;
  }, [staff, searchQuery, filters, services]);

  // Get unique departments from services for filter options
  const availableDepartments = useMemo(() => {
    const departments = new Set<string>();
    services.forEach((service) => {
      if (service.category) {
        const categoryName = typeof service.category === 'string' ? service.category : service.category.name;
        if (categoryName) departments.add(categoryName);
      }
    });
    return Array.from(departments).sort();
  }, [services]);

  const activeFilterCount = useMemo(() => {
    return [filters.role, filters.status, filters.department].filter(Boolean).length;
  }, [filters]);

  const clearFilters = () => {
    setFilters({ role: '', status: '', department: '' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const resetStaffForm = () => {
    setStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'staff',
      certifications: '',
      commissionRate: '',
    });
    setSelectedWorkingDays([]);
  };

  const openNewStaffModal = () => {
    resetStaffForm();
    setEditingStaff(null);
    setShowNewStaff(true);
  };

  const openEditStaffModal = (member: StaffMember) => {
    setStaffForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      certifications: member.certifications || '',
      commissionRate: member.commissionRate?.toString() || '',
    });
    // Extract working days from availability
    const workingDays = member.staffAvailability
      ?.filter((a) => a.isAvailable)
      .map((a) => a.dayOfWeek) || [];
    setSelectedWorkingDays(workingDays);
    setEditingStaff(member);
    setShowNewStaff(true);
  };

  const closeStaffModal = () => {
    setShowNewStaff(false);
    setEditingStaff(null);
    resetStaffForm();
  };

  const handleSaveStaff = async () => {
    if (!staffForm.firstName || !staffForm.lastName || !staffForm.email) return;

    setIsSubmitting(true);
    try {
      const data: CreateStaffInput = {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        email: staffForm.email,
        phone: staffForm.phone || undefined,
        role: staffForm.role,
        certifications: staffForm.certifications || undefined,
        commissionRate: staffForm.commissionRate ? parseFloat(staffForm.commissionRate) : undefined,
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, data as UpdateStaffInput);
      } else {
        await createStaff(data);
      }
      closeStaffModal();
    } catch (err) {
      console.error('Failed to save staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteStaff(id);
      setDeleteConfirm(null);
      setSelectedStaff(null);
    } catch (err) {
      console.error('Failed to delete staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStaffStatus = async (member: StaffMember) => {
    setIsSubmitting(true);
    try {
      await updateStaff(member.id, { isActive: !member.isActive });
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setSelectedWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to get display info from staff member (since API data may differ from mock)
  const getStaffDisplayInfo = (member: StaffMember) => {
    // Get services this staff member provides
    const staffServiceIds = member.staffServices?.map((s) => s.serviceId) || [];
    const staffServicesNames = services
      .filter((s) => staffServiceIds.includes(s.id))
      .map((s) => s.name);

    // Get working days from availability
    const workingDays = member.staffAvailability
      ?.filter((a) => a.isAvailable)
      .map((a) => dayNames[a.dayOfWeek]) || [];

    // Get working hours (from first availability entry)
    const firstAvailability = member.staffAvailability?.find((a) => a.isAvailable);
    const workingHours = firstAvailability
      ? `${firstAvailability.startTime} - ${firstAvailability.endTime}`
      : 'Not set';

    return {
      specialties: staffServicesNames,
      workingDays,
      workingHours,
    };
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar
        currentPage="staff"
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

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
                <h1 className="text-2xl font-bold text-charcoal">Staff</h1>
                <p className="text-sm text-charcoal/60">
                  {staff.length} team member{staff.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={openNewStaffModal}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Staff</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, or role..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/10 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-charcoal/70 hover:bg-charcoal/5 transition-colors ${
                  activeFilterCount > 0 ? 'border-sage bg-sage/5' : 'border-charcoal/10'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-sage text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-charcoal/10 z-40 overflow-hidden">
                    <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
                      <span className="font-medium text-charcoal">Filters</span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-sage hover:text-sage-dark transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Role Filter */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Role
                        </label>
                        <select
                          value={filters.role}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, role: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white text-sm"
                        >
                          <option value="">All roles</option>
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white text-sm"
                        >
                          <option value="">All statuses</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Department Filter */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Department
                        </label>
                        <select
                          value={filters.department}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, department: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white text-sm"
                        >
                          <option value="">All departments</option>
                          {availableDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                          {availableDepartments.length === 0 && (
                            <option value="" disabled>
                              No departments available
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 border-t border-charcoal/10 bg-charcoal/5">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="w-full px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors text-sm"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
              <p className="text-charcoal/60">Loading staff...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 p-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load staff</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Staff Grid */}
        {!isLoading && !error && (
          <div className="flex-1 p-6 overflow-auto">
            {filteredStaff.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-12 text-center">
                <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                <p className="text-charcoal/60">
                  {searchQuery ? 'No staff members found' : 'No staff members yet'}
                </p>
                <p className="text-sm text-charcoal/40 mt-1 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first team member to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={openNewStaffModal}
                    className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                  >
                    Add Staff Member
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStaff.map((member) => {
                  const displayInfo = getStaffDisplayInfo(member);
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6 hover:shadow-card transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sage font-bold text-lg">
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-charcoal">
                              {member.firstName} {member.lastName}
                            </h3>
                            <p className="text-sm text-charcoal/60">{roleLabels[member.role] || member.role}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            statusColors[member.isActive ? 'active' : 'inactive']
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Specialties (Services) */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {displayInfo.specialties.length > 0 ? (
                          <>
                            {displayInfo.specialties.slice(0, 3).map((specialty) => (
                              <span
                                key={specialty}
                                className="px-2 py-1 bg-charcoal/5 rounded-lg text-xs text-charcoal/70"
                              >
                                {specialty}
                              </span>
                            ))}
                            {displayInfo.specialties.length > 3 && (
                              <span className="px-2 py-1 text-xs text-charcoal/50">
                                +{displayInfo.specialties.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-1 bg-charcoal/5 rounded-lg text-xs text-charcoal/50">
                            No services assigned
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-charcoal/10">
                        <div className="text-center">
                          <p className="font-semibold text-charcoal capitalize">{member.role}</p>
                          <p className="text-xs text-charcoal/50">Role</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-charcoal">
                            {member.commissionRate ? `${member.commissionRate}%` : 'N/A'}
                          </p>
                          <p className="text-xs text-charcoal/50">Commission</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Staff Detail Drawer */}
      {selectedStaff && (
        <>
          <div
            className="fixed inset-0 bg-charcoal/50 z-40"
            onClick={() => setSelectedStaff(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">Staff Details</h2>
              <button
                onClick={() => setSelectedStaff(null)}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Staff Header */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                  {selectedStaff.avatarUrl ? (
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sage font-bold text-2xl">
                      {selectedStaff.firstName[0]}
                      {selectedStaff.lastName[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-charcoal">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <p className="text-charcoal/60">{roleLabels[selectedStaff.role] || selectedStaff.role}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[selectedStaff.isActive ? 'active' : 'inactive']
                    }`}
                  >
                    {selectedStaff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => openEditStaffModal(selectedStaff)}
                  className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                  <Mail className="w-5 h-5 text-charcoal/40" />
                  <span className="text-charcoal">{selectedStaff.email}</span>
                </div>
                {selectedStaff.phone && (
                  <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                    <Phone className="w-5 h-5 text-charcoal/40" />
                    <span className="text-charcoal">{selectedStaff.phone}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/calendar"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  View Schedule
                </Link>
                <button
                  onClick={() => handleToggleStaffStatus(selectedStaff)}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-xl font-medium transition-colors ${
                    selectedStaff.isActive
                      ? 'border-charcoal/20 text-charcoal hover:bg-charcoal/5'
                      : 'border-sage text-sage hover:bg-sage/5'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : selectedStaff.isActive ? (
                    'Deactivate'
                  ) : (
                    'Activate'
                  )}
                </button>
              </div>

              {/* Staff Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-sage/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-sage" />
                    <span className="text-lg font-bold text-charcoal capitalize">{selectedStaff.role}</span>
                  </div>
                  <p className="text-xs text-charcoal/60">Role</p>
                </div>
                <div className="p-4 bg-peach/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-peach-dark" />
                    <span className="text-lg font-bold text-charcoal">
                      {selectedStaff.commissionRate ? `${selectedStaff.commissionRate}%` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/60">Commission Rate</p>
                </div>
                <div className="p-4 bg-lavender/20 rounded-xl col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-5 h-5 text-lavender-dark" />
                    <span className="text-lg font-bold text-charcoal">
                      {formatDate(selectedStaff.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/60">Member since</p>
                </div>
              </div>

              {/* Services (Specialties) */}
              {(() => {
                const displayInfo = getStaffDisplayInfo(selectedStaff);
                return (
                  <>
                    <div>
                      <h4 className="font-medium text-charcoal mb-3">Assigned Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayInfo.specialties.length > 0 ? (
                          displayInfo.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="px-3 py-1.5 bg-charcoal/5 rounded-lg text-sm text-charcoal"
                            >
                              {specialty}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-charcoal/50">No services assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Working Schedule */}
                    <div>
                      <h4 className="font-medium text-charcoal mb-3">Working Schedule</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-xl">
                          <Clock className="w-5 h-5 text-charcoal/40" />
                          <span className="text-charcoal">{displayInfo.workingHours}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dayNames.map((day, index) => (
                            <span
                              key={day}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                displayInfo.workingDays.includes(day)
                                  ? 'bg-sage/20 text-sage-dark'
                                  : 'bg-charcoal/5 text-charcoal/40'
                              }`}
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Certifications */}
              {selectedStaff.certifications && (
                <div>
                  <h4 className="font-medium text-charcoal mb-3">Certifications</h4>
                  <p className="text-sm text-charcoal/70 p-3 bg-charcoal/5 rounded-xl">
                    {selectedStaff.certifications}
                  </p>
                </div>
              )}

              {/* Delete Button */}
              <div className="pt-4 border-t border-charcoal/10">
                <button
                  onClick={() => setDeleteConfirm({ id: selectedStaff.id, name: `${selectedStaff.firstName} ${selectedStaff.lastName}` })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-rose-200 text-rose-600 rounded-xl font-medium hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Staff Member
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New/Edit Staff Modal */}
      {showNewStaff && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button
                onClick={closeStaffModal}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">First Name</label>
                  <input
                    type="text"
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Last Name</label>
                  <input
                    type="text"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Email</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="staff@peacase.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Phone</label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, role: e.target.value as 'owner' | 'admin' | 'staff' }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={staffForm.commissionRate}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Certifications
                </label>
                <textarea
                  rows={2}
                  value={staffForm.certifications}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, certifications: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                  placeholder="List certifications, licenses, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <label
                      key={day}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedWorkingDays.includes(index)
                          ? 'bg-sage/20 text-sage-dark'
                          : 'bg-charcoal/5 hover:bg-charcoal/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkingDays.includes(index)}
                        onChange={() => toggleWorkingDay(index)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={closeStaffModal}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                disabled={isSubmitting || !staffForm.firstName || !staffForm.lastName || !staffForm.email}
                className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingStaff ? 'Save Changes' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-charcoal mb-2">Delete Staff Member?</h2>
              <p className="text-charcoal/60 mb-6">
                Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteStaff(deleteConfirm.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
