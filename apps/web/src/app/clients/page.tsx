'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Bell,
  Menu,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Star,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  Edit2,
  MessageSquare,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  DollarSign,
  UserCheck,
  UserX,
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookingModal } from '@/components/BookingModal';
import { useClients, Client, CreateClientInput, UpdateClientInput } from '@/hooks';
import { EmptyState } from '@peacase/ui';

// Filter types
interface ClientFilters {
  status: 'all' | 'active' | 'inactive';
  lastVisit: 'all' | '7days' | '30days' | '90days' | 'over90days';
  totalSpent: 'all' | 'under100' | '100to500' | '500to1000' | 'over1000';
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-700',
  Regular: 'bg-sage/20 text-sage-dark',
  New: 'bg-blue-100 text-blue-700',
  Membership: 'bg-purple-100 text-purple-700',
};

function ClientsContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ClientFilters>({
    status: 'all',
    lastVisit: 'all',
    totalSpent: 'all',
  });
  const [clientMenuId, setClientMenuId] = useState<string | null>(null);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingClient, setBookingClient] = useState<{ id: string; name: string } | null>(null);

  // Form state for new/edit client
  const [formData, setFormData] = useState<CreateClientInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    refetch,
  } = useClients();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch clients when debounced search changes
  useEffect(() => {
    if (debouncedSearch) {
      fetchClients(debouncedSearch);
    } else {
      fetchClients();
    }
  }, [debouncedSearch, fetchClients]);

  // Filter clients locally for immediate feedback while typing and apply filters
  const filteredClients = useMemo(() => {
    return (clients || []).filter((client) => {
      // Search filter
      const matchesSearch =
        client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.phone && client.phone.includes(searchQuery));

      if (!matchesSearch) return false;

      // Status filter (based on recent activity - active if visited in last 90 days)
      if (filters.status !== 'all') {
        const lastVisitDate = client.lastVisit ? new Date(client.lastVisit) : null;
        const daysSinceVisit = lastVisitDate
          ? Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        const isActive = daysSinceVisit <= 90;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }

      // Last visit filter
      if (filters.lastVisit !== 'all' && client.lastVisit) {
        const lastVisitDate = new Date(client.lastVisit);
        const daysSinceVisit = Math.floor(
          (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (filters.lastVisit) {
          case '7days':
            if (daysSinceVisit > 7) return false;
            break;
          case '30days':
            if (daysSinceVisit > 30) return false;
            break;
          case '90days':
            if (daysSinceVisit > 90) return false;
            break;
          case 'over90days':
            if (daysSinceVisit <= 90) return false;
            break;
        }
      } else if (filters.lastVisit !== 'all' && !client.lastVisit) {
        // If filtering by last visit but client has no visit, exclude unless filtering for over90days
        if (filters.lastVisit !== 'over90days') return false;
      }

      // Total spent filter
      if (filters.totalSpent !== 'all') {
        const totalSpent = client.totalSpent || 0;
        switch (filters.totalSpent) {
          case 'under100':
            if (totalSpent >= 100) return false;
            break;
          case '100to500':
            if (totalSpent < 100 || totalSpent >= 500) return false;
            break;
          case '500to1000':
            if (totalSpent < 500 || totalSpent >= 1000) return false;
            break;
          case 'over1000':
            if (totalSpent < 1000) return false;
            break;
        }
      }

      return true;
    });
  }, [clients, searchQuery, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.lastVisit !== 'all') count++;
    if (filters.totalSpent !== 'all') count++;
    return count;
  }, [filters]);

  // Handle message button click - open email client
  const handleMessageClient = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (client.email) {
      const subject = encodeURIComponent(`Hello from our spa`);
      const body = encodeURIComponent(`Dear ${client.firstName},\n\n`);
      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
    } else {
      // If no email, show an alert or toast
      alert(`No email address available for ${client.firstName} ${client.lastName}`);
    }
  };

  // Handle book button click - open booking modal with client pre-selected
  const handleBookAppointment = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookingClient({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
    });
    setShowBookingModal(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      lastVisit: 'all',
      totalSpent: 'all',
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
    });
    setSubmitError(null);
  };

  const handleOpenNewClient = () => {
    resetForm();
    setShowNewClient(true);
  };

  const handleCloseNewClient = () => {
    setShowNewClient(false);
    resetForm();
  };

  const handleOpenEditClient = (client: Client) => {
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
      birthday: client.birthday || '',
    });
    setShowEditClient(true);
  };

  const handleCloseEditClient = () => {
    setShowEditClient(false);
    resetForm();
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createClient(formData);
      handleCloseNewClient();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const updatedClient = await updateClient(selectedClient.id, formData);
      setSelectedClient(updatedClient);
      handleCloseEditClient();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteClient(selectedClient.id);
      setSelectedClient(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get tags based on client data (could be expanded with actual tags from API)
  const getClientTags = (client: Client) => {
    const tags: string[] = [];
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated <= 30) tags.push('New');
    return tags;
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex">
      <AppSidebar
        currentPage="clients"
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal dark:text-white">Clients</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => refetch()}
                className="p-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white"
                title="Refresh clients"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <ThemeToggle />
              <NotificationDropdown />
              <button
                onClick={handleOpenNewClient}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Client</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name, email, or phone..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/10 bg-white dark:bg-charcoal text-charcoal dark:text-white text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
              />
              {isLoading && searchQuery && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-white/40 animate-spin" />
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  activeFilterCount > 0
                    ? 'border-sage bg-sage/10 text-sage-dark'
                    : 'border-charcoal/10 dark:border-white/10 text-charcoal/70 dark:text-white/70 hover:bg-charcoal/5 dark:hover:bg-white/5'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-sage text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-sidebar rounded-xl shadow-lg border border-charcoal/10 dark:border-white/10 z-20 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-charcoal dark:text-white">Filter Clients</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="text-sm text-sage hover:text-sage-dark"
                        >
                          Reset all
                        </button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-charcoal dark:text-white mb-2">
                        <UserCheck className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value as ClientFilters['status'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      >
                        <option value="all">All clients</option>
                        <option value="active">Active (visited in 90 days)</option>
                        <option value="inactive">Inactive (no visit in 90+ days)</option>
                      </select>
                    </div>

                    {/* Last Visit Filter */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-charcoal dark:text-white mb-2">
                        <Clock className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                        Last Visit
                      </label>
                      <select
                        value={filters.lastVisit}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            lastVisit: e.target.value as ClientFilters['lastVisit'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      >
                        <option value="all">Any time</option>
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                        <option value="over90days">Over 90 days ago</option>
                      </select>
                    </div>

                    {/* Total Spent Filter */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-charcoal dark:text-white mb-2">
                        <DollarSign className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                        Total Spent
                      </label>
                      <select
                        value={filters.totalSpent}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            totalSpent: e.target.value as ClientFilters['totalSpent'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      >
                        <option value="all">Any amount</option>
                        <option value="under100">Under $100</option>
                        <option value="100to500">$100 - $500</option>
                        <option value="500to1000">$500 - $1,000</option>
                        <option value="over1000">Over $1,000</option>
                      </select>
                    </div>

                    {/* Apply button */}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-rose/10 border border-rose/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose flex-shrink-0" />
            <div className="flex-1">
              <p className="text-charcoal dark:text-white font-medium">Failed to load clients</p>
              <p className="text-sm text-charcoal/60 dark:text-white/60">{error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white dark:bg-sidebar border border-charcoal/20 dark:border-white/20 rounded-lg text-sm font-medium text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5"
            >
              Retry
            </button>
          </div>
        )}

        {/* Client List */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-charcoal/5 dark:bg-white/5 text-sm font-medium text-charcoal/60 dark:text-white/60">
              <div className="col-span-3">Client</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-3">Notes</div>
              <div className="col-span-1"></div>
            </div>

            {/* Loading State */}
            {isLoading && (clients || []).length === 0 ? (
              <div className="divide-y divide-charcoal/10 dark:divide-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-charcoal/10 dark:bg-white/10" />
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-charcoal/10 dark:bg-white/10 rounded mb-1" />
                        <div className="w-16 h-3 bg-charcoal/10 dark:bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="w-32 h-4 bg-charcoal/10 dark:bg-white/10 rounded mb-1" />
                      <div className="w-24 h-3 bg-charcoal/10 dark:bg-white/10 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="w-20 h-4 bg-charcoal/10 dark:bg-white/10 rounded" />
                    </div>
                    <div className="col-span-3">
                      <div className="w-full h-4 bg-charcoal/10 dark:bg-white/10 rounded" />
                    </div>
                    <div className="col-span-1" />
                  </div>
                ))}
              </div>
            ) : (
              /* Table Body */
              <div className="divide-y divide-charcoal/10 dark:divide-white/10">
                {(filteredClients || []).map((client) => {
                  const tags = getClientTags(client);
                  return (
                    <div
                      key={client.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-sage/5 dark:hover:bg-sage/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Client Info */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sage font-semibold text-sm">
                            {client.firstName?.[0] || '?'}
                            {client.lastName?.[0] || ''}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-charcoal dark:text-white truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${tagColors[tag] || 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-3 flex flex-col justify-center">
                        {client.email && (
                          <p className="text-sm text-charcoal dark:text-white truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-charcoal/40 dark:text-white/40" />
                            {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-charcoal/60 dark:text-white/60 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-charcoal/40 dark:text-white/40" />
                            {client.phone}
                          </p>
                        )}
                        {!client.email && !client.phone && (
                          <p className="text-sm text-charcoal/40 dark:text-white/40">No contact info</p>
                        )}
                      </div>

                      {/* Created */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-charcoal dark:text-white">
                          {formatDate(client.createdAt)}
                        </span>
                      </div>

                      {/* Notes */}
                      <div className="col-span-3 flex items-center">
                        {client.notes ? (
                          <span className="text-sm text-charcoal/60 dark:text-white/60 truncate">{client.notes}</span>
                        ) : (
                          <span className="text-sm text-charcoal/40 dark:text-white/40">No notes</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientMenuId(clientMenuId === client.id ? null : client.id);
                          }}
                          className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {clientMenuId === client.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-sidebar rounded-xl shadow-lg border border-charcoal/10 dark:border-white/10 py-2 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setClientMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-charcoal dark:text-white hover:bg-sage/5 dark:hover:bg-sage/10 flex items-center gap-2"
                            >
                              <ChevronRight className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setFormData({
                                  firstName: client.firstName,
                                  lastName: client.lastName,
                                  email: client.email || '',
                                  phone: client.phone || '',
                                  notes: client.notes || '',
                                });
                                setShowEditClient(true);
                                setClientMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-charcoal dark:text-white hover:bg-sage/5 dark:hover:bg-sage/10 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Client
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowDeleteConfirm(true);
                                setClientMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-rose/5 text-rose flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Client
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && (filteredClients || []).length === 0 && (
              <EmptyState
                icon={Users}
                title={searchQuery ? "No clients found" : "No clients yet"}
                description={searchQuery ? "Try adjusting your search or filters" : "Add your first client to get started"}
                action={!searchQuery ? {
                  label: "Add Client",
                  onClick: handleOpenNewClient,
                  icon: Plus
                } : undefined}
              />
            )}
          </div>
        </div>
      </main>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <>
          <div
            className="fixed inset-0 bg-charcoal/50 z-40"
            onClick={() => setSelectedClient(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-sidebar shadow-2xl z-50 overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal dark:text-white">Client Details</h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sage font-bold text-xl">
                    {selectedClient.firstName?.[0] || '?'}
                    {selectedClient.lastName?.[0] || ''}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-charcoal dark:text-white">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                  <div className="flex gap-2 mt-2">
                    {getClientTags(selectedClient).map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded text-xs font-medium ${tagColors[tag] || 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEditClient(selectedClient)}
                  className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                {selectedClient.email && (
                  <div className="flex items-center gap-3 p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <Mail className="w-5 h-5 text-charcoal/40 dark:text-white/40" />
                    <span className="text-charcoal dark:text-white">{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.phone && (
                  <div className="flex items-center gap-3 p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <Phone className="w-5 h-5 text-charcoal/40 dark:text-white/40" />
                    <span className="text-charcoal dark:text-white">{selectedClient.phone}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              {(selectedClient.address || selectedClient.city) && (
                <div>
                  <h4 className="font-medium text-charcoal dark:text-white mb-3">Address</h4>
                  <div className="p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    {selectedClient.address && (
                      <p className="text-charcoal dark:text-white">{selectedClient.address}</p>
                    )}
                    {(selectedClient.city || selectedClient.state || selectedClient.zip) && (
                      <p className="text-charcoal/60 dark:text-white/60">
                        {[selectedClient.city, selectedClient.state, selectedClient.zip]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedClient.notes && (
                <div>
                  <h4 className="font-medium text-charcoal dark:text-white mb-3">Notes</h4>
                  <div className="p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <p className="text-charcoal dark:text-white">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleBookAppointment(selectedClient)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Book
                </button>
                <button
                  onClick={() => handleMessageClient(selectedClient)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message
                </button>
              </div>

              {/* Communication Preferences */}
              <div>
                <h4 className="font-medium text-charcoal dark:text-white mb-3">Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <span className="text-charcoal dark:text-white">Communication</span>
                    <span className="text-charcoal/60 dark:text-white/60 capitalize">
                      {selectedClient.communicationPreference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <span className="text-charcoal dark:text-white">Appointment Reminders</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedClient.optedInReminders
                          ? 'bg-sage/20 text-sage-dark'
                          : 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'
                      }`}
                    >
                      {selectedClient.optedInReminders ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                    <span className="text-charcoal dark:text-white">Marketing</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedClient.optedInMarketing
                          ? 'bg-sage/20 text-sage-dark'
                          : 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'
                      }`}
                    >
                      {selectedClient.optedInMarketing ? 'Opted In' : 'Opted Out'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl">
                <span className="text-charcoal dark:text-white">Member Since</span>
                <span className="text-charcoal/60 dark:text-white/60">{formatDate(selectedClient.createdAt)}</span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-rose/30 text-rose rounded-xl font-medium hover:bg-rose/5 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete Client
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-2">Delete Client</h2>
              <p className="text-charcoal/60 dark:text-white/60">
                Are you sure you want to delete{' '}
                <span className="font-medium text-charcoal dark:text-white">
                  {selectedClient.firstName} {selectedClient.lastName}
                </span>
                ? This action cannot be undone.
              </p>
              {submitError && (
                <div className="mt-4 p-3 bg-rose/10 border border-rose/20 rounded-lg">
                  <p className="text-sm text-rose">{submitError}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-rose text-white rounded-xl font-medium hover:bg-rose/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <form onSubmit={handleCreateClient}>
              <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-charcoal dark:text-white">Add New Client</h2>
                <button
                  type="button"
                  onClick={handleCloseNewClient}
                  className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {submitError && (
                  <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose flex-shrink-0" />
                    <p className="text-sm text-rose">{submitError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      First Name <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Last Name <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="client@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="Any special notes about this client..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseNewClient}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClient && selectedClient && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <form onSubmit={handleUpdateClient}>
              <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-charcoal dark:text-white">Edit Client</h2>
                <button
                  type="button"
                  onClick={handleCloseEditClient}
                  className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {submitError && (
                  <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose flex-shrink-0" />
                    <p className="text-sm text-rose">{submitError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      First Name <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Last Name <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="client@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">ZIP</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="ZIP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="Any special notes about this client..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditClient}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close client menu */}
      {clientMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setClientMenuId(null)} />
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingClient(null);
        }}
        onSuccess={() => {
          // Refresh client data to show new appointment
          refetch();
        }}
        prefilledClientId={bookingClient?.id}
        prefilledClientName={bookingClient?.name}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AuthGuard>
      <ClientsContent />
    </AuthGuard>
  );
}
