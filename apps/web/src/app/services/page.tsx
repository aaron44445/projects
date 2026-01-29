'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Menu,
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  X,
  Edit2,
  Trash2,
  GripVertical,
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  Check,
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useServices, useStaff, type Service, type ServiceCategory, type CreateServiceInput, type UpdateServiceInput, type CreateCategoryInput } from '@/hooks';
import { useSalonSettings } from '@/contexts/SalonSettingsContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/i18n';
import { EmptyState, Modal } from '@peacase/ui';

interface CategoryWithUI extends ServiceCategory {
  expanded: boolean;
}

interface DragState {
  categoryId: string;
  serviceId: string;
  startIndex: number;
  currentIndex: number;
}

function ServicesContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewService, setShowNewService] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'service' | 'category'; id: string; name: string } | null>(null);

  // Drag and drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Form state for service modal
  const [serviceForm, setServiceForm] = useState<{
    name: string;
    description: string;
    categoryId: string;
    durationMinutes: number;
    price: string;
    memberPrice: string;
    color: string;
  }>({
    name: '',
    description: '',
    categoryId: '',
    durationMinutes: 60,
    price: '',
    memberPrice: '',
    color: '#C7DCC8',
  });

  // Form state for category modal
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });

  const {
    services,
    categories,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    createCategory,
    deleteCategory,
    refetch,
  } = useServices();

  const { staff, setStaffServices } = useStaff();
  const { formatPrice, currency } = useSalonSettings();
  const currencySymbol = SUPPORTED_CURRENCIES[currency as CurrencyCode]?.symbol || '$';

  // Track assigned staff for the current service being edited
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);

  // Group services by category for display
  const categoriesWithServices = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithUI & { services: Service[] }>();

    // Initialize with all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        expanded: expandedCategories.has(cat.id),
        services: [],
      });
    });

    // Add uncategorized group
    categoryMap.set('uncategorized', {
      id: 'uncategorized',
      salonId: '',
      name: 'Uncategorized',
      description: 'Services without a category',
      displayOrder: 9999,
      createdAt: '',
      expanded: expandedCategories.has('uncategorized'),
      services: [],
    });

    // Assign services to categories
    services.forEach((service) => {
      const categoryId = service.categoryId || 'uncategorized';
      const category = categoryMap.get(categoryId);
      if (category) {
        category.services.push(service);
      }
    });

    // Filter out empty categories (except if searching)
    const result = Array.from(categoryMap.values())
      .filter((cat) => cat.services.length > 0 || searchQuery)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Apply search filter
    if (searchQuery) {
      return result.map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (service) =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.services.length > 0);
    }

    return result;
  }, [categories, services, expandedCategories, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Expand all categories on initial load
  useMemo(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categories.map((c) => c.id)));
    }
  }, [categories]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}hr`;
    return `${hours}hr ${mins}min`;
  };

  const totalServices = services.length;

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      categoryId: categories?.length > 0 ? categories[0].id : '',
      durationMinutes: 60,
      price: '',
      memberPrice: '',
      color: '#C7DCC8',
    });
  };

  const openNewServiceModal = () => {
    resetServiceForm();
    setEditingService(null);
    setShowNewService(true);
  };

  const openEditServiceModal = (service: Service) => {
    setServiceForm({
      name: service.name,
      description: service.description || '',
      categoryId: service.categoryId || '',
      durationMinutes: service.durationMinutes,
      price: service.price.toString(),
      memberPrice: service.memberPrice?.toString() || '',
      color: service.color,
    });
    // Load assigned staff for this service
    const assignedStaff = staff.filter(
      (s) => s.staffServices?.some((ss) => ss.serviceId === service.id)
    ).map((s) => s.id);
    setAssignedStaffIds(assignedStaff);
    setEditingService(service);
    setShowNewService(true);
  };

  const closeServiceModal = () => {
    setShowNewService(false);
    setEditingService(null);
    resetServiceForm();
    setAssignedStaffIds([]);
  };

  const toggleStaffAssignment = (staffId: string) => {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) return;

    setIsSubmitting(true);
    try {
      const data: CreateServiceInput = {
        name: serviceForm.name,
        description: serviceForm.description || undefined,
        categoryId: serviceForm.categoryId || undefined,
        durationMinutes: serviceForm.durationMinutes,
        price: parseFloat(serviceForm.price),
        memberPrice: serviceForm.memberPrice ? parseFloat(serviceForm.memberPrice) : undefined,
        color: serviceForm.color,
      };

      let serviceId: string;

      if (editingService) {
        await updateService(editingService.id, data as UpdateServiceInput);
        serviceId = editingService.id;
      } else {
        const newService = await createService(data);
        serviceId = newService.id;
      }

      // Update staff assignments for each staff member
      // For each staff who should be assigned, add this service to their services
      for (const staffId of assignedStaffIds) {
        const staffMember = staff.find((s) => s.id === staffId);
        if (staffMember) {
          const currentServiceIds = staffMember.staffServices?.map((ss) => ss.serviceId) || [];
          if (!currentServiceIds.includes(serviceId)) {
            await setStaffServices(staffId, { serviceIds: [...currentServiceIds, serviceId] });
          }
        }
      }

      // For staff who were previously assigned but are now unassigned, remove this service
      for (const staffMember of staff) {
        const wasAssigned = staffMember.staffServices?.some((ss) => ss.serviceId === serviceId);
        const isNowAssigned = assignedStaffIds.includes(staffMember.id);

        if (wasAssigned && !isNowAssigned) {
          const updatedServiceIds = staffMember.staffServices
            ?.filter((ss) => ss.serviceId !== serviceId)
            .map((ss) => ss.serviceId) || [];
          await setStaffServices(staffMember.id, { serviceIds: updatedServiceIds });
        }
      }

      closeServiceModal();
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteService(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewCategoryModal = () => {
    setCategoryForm({ name: '', description: '' });
    setShowNewCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;

    setIsSubmitting(true);
    try {
      const data: CreateCategoryInput = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      };
      await createCategory(data);
      setShowNewCategory(false);
      setCategoryForm({ name: '', description: '' });
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteCategory(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    categoryId: string,
    serviceId: string,
    index: number
  ) => {
    e.preventDefault();
    setDragState({
      categoryId,
      serviceId,
      startIndex: index,
      currentIndex: index,
    });
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((
    categoryId: string,
    index: number
  ) => {
    if (!dragState || dragState.categoryId !== categoryId) return;
    if (index !== dragState.currentIndex) {
      setDragState((prev) => prev ? { ...prev, currentIndex: index } : null);
    }
  }, [dragState]);

  const handleDragEnd = useCallback(async () => {
    if (!dragState || !isDragging) {
      setDragState(null);
      setIsDragging(false);
      return;
    }

    const { categoryId, startIndex, currentIndex } = dragState;

    // Find the category and its services
    const category = categoriesWithServices.find((c) => c.id === categoryId);
    if (!category || startIndex === currentIndex) {
      setDragState(null);
      setIsDragging(false);
      return;
    }

    // Calculate new order for all affected services
    const reorderedServices = [...category.services];
    const [movedService] = reorderedServices.splice(startIndex, 1);
    reorderedServices.splice(currentIndex, 0, movedService);

    // Update displayOrder for all services in the reordered list
    try {
      const updatePromises = reorderedServices.map((service, index) => {
        if (service.displayOrder !== index) {
          return updateService(service.id, { displayOrder: index });
        }
        return Promise.resolve(null);
      });
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Failed to reorder services:', err);
      // Refetch to restore original order on error
      refetch();
    }

    setDragState(null);
    setIsDragging(false);
  }, [dragState, isDragging, categoriesWithServices, updateService, refetch]);

  // Get the visually reordered services for a category during drag
  const getDisplayServices = useCallback((categoryId: string, services: Service[]) => {
    if (!dragState || dragState.categoryId !== categoryId) {
      return services;
    }

    const { startIndex, currentIndex } = dragState;
    if (startIndex === currentIndex) {
      return services;
    }

    const reordered = [...services];
    const [movedItem] = reordered.splice(startIndex, 1);
    reordered.splice(currentIndex, 0, movedItem);
    return reordered;
  }, [dragState]);

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex">
      <AppSidebar
        currentPage="services"
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
              <div>
                <h1 className="text-2xl font-bold text-charcoal dark:text-white">Services</h1>
                <p className="text-sm text-charcoal/60 dark:text-white/60">
                  {categories.length} categories, {totalServices} services
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <NotificationDropdown />
              <button
                onClick={openNewCategoryModal}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all"
              >
                <Plus className="w-5 h-5" />
                Category
              </button>
              <button
                onClick={openNewServiceModal}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Service</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
              <p className="text-charcoal/60 dark:text-white/60">Loading services...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 p-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load services</p>
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

        {/* Services List */}
        {!isLoading && !error && (
          <div className="flex-1 p-6 overflow-auto">
            {categoriesWithServices.length === 0 ? (
              <div className="bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5">
                <EmptyState
                  icon={Clock}
                  title={searchQuery ? "No services found" : "No services yet"}
                  description={searchQuery ? "Try adjusting your search" : "Add your first service to start booking appointments"}
                  action={!searchQuery ? {
                    label: "Add Service",
                    onClick: openNewServiceModal,
                    icon: Plus
                  } : undefined}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {categoriesWithServices.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5 overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div
                        className={`transform transition-transform ${category.expanded ? 'rotate-90' : ''}`}
                      >
                        <ChevronRight className="w-5 h-5 text-charcoal/40 dark:text-white/40" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-charcoal dark:text-white">{category.name}</h3>
                        <p className="text-sm text-charcoal/60 dark:text-white/60">
                          {category.services.length} services
                        </p>
                      </div>
                      {category.id !== 'uncategorized' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ type: 'category', id: category.id, name: category.name });
                          }}
                          className="p-2 text-charcoal/40 dark:text-white/40 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </button>

                    {/* Services */}
                    {category.expanded && (
                      <div className="border-t border-charcoal/10 dark:border-white/10">
                        {category.services.map((service, index) => (
                          <div
                            key={service.id}
                            className={`px-6 py-4 flex items-center gap-4 hover:bg-sage/5 dark:hover:bg-sage/10 transition-colors ${
                              index !== category.services.length - 1 ? 'border-b border-charcoal/10 dark:border-white/10' : ''
                            }`}
                          >
                            <div className="cursor-grab text-charcoal/20 dark:text-white/20 hover:text-charcoal/40 dark:hover:text-white/40">
                              <GripVertical className="w-5 h-5" />
                            </div>

                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: service.color }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-charcoal dark:text-white">{service.name}</h4>
                                {!service.isActive && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-charcoal/60 dark:text-white/60 truncate">{service.description}</p>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-charcoal/60 dark:text-white/60">
                              <Clock className="w-4 h-4" />
                              {formatDuration(service.durationMinutes)}
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-charcoal dark:text-white">{formatPrice(service.price)}</p>
                              {service.memberPrice && (
                                <p className="text-xs text-sage">{formatPrice(service.memberPrice)} member</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditServiceModal(service)}
                                className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'service', id: service.id, name: service.name })}
                                className="p-2 text-charcoal/40 dark:text-white/40 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New/Edit Service Modal */}
      <Modal
        isOpen={showNewService}
        onClose={closeServiceModal}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Service Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., Haircut & Style"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="Brief description of the service..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Category</label>
                <select
                  value={serviceForm.categoryId}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Duration</label>
                  <select
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  >
                    {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((min) => (
                      <option key={min} value={min}>
                        {formatDuration(min)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={serviceForm.color}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 dark:border-white/20 cursor-pointer"
                    />
                    <span className="text-sm text-charcoal/60 dark:text-white/60">Calendar color</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Member Price (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceForm.memberPrice}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, memberPrice: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Assignment Section */}
              {staff.length > 0 && (
                <div className="border-t border-charcoal/10 dark:border-white/10 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
                    <label className="block text-sm font-medium text-charcoal dark:text-white">
                      Assigned Staff ({assignedStaffIds.length} selected)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {staff.map((staffMember) => {
                      const isAssigned = assignedStaffIds.includes(staffMember.id);
                      return (
                        <button
                          key={staffMember.id}
                          type="button"
                          onClick={() => toggleStaffAssignment(staffMember.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isAssigned
                              ? 'border-sage bg-sage/5 dark:bg-sage/10'
                              : 'border-charcoal/10 dark:border-white/10 hover:border-sage/50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isAssigned ? 'border-sage bg-sage' : 'border-charcoal/30'
                            }`}
                          >
                            {isAssigned && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-charcoal dark:text-white text-sm truncate">
                              {staffMember.firstName} {staffMember.lastName}
                            </p>
                            <p className="text-xs text-charcoal/50 dark:text-white/50 capitalize">{staffMember.role}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-charcoal/50 dark:text-white/50 mt-2">
                    Select which staff members can perform this service
                  </p>
                </div>
              )}

          <div className="pt-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
            <button
              onClick={closeServiceModal}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveService}
              disabled={isSubmitting || !serviceForm.name || !serviceForm.price}
              className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingService ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </div>
      </Modal>

      {/* New Category Modal */}
      <Modal
        isOpen={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        title="Add Category"
        size="md"
      >
        <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., Waxing Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="Brief description..."
                />
              </div>

          <div className="pt-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
            <button
              onClick={() => setShowNewCategory(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCategory}
              disabled={isSubmitting || !categoryForm.name}
              className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm?.type === 'service' ? 'Service' : 'Category'}?`}
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <p className="text-charcoal/60 dark:text-white/60 mb-6">
            Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirm?.type === 'service') {
                  handleDeleteService(deleteConfirm.id);
                } else if (deleteConfirm) {
                  handleDeleteCategory(deleteConfirm.id);
                }
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <AuthGuard>
      <ServicesContent />
    </AuthGuard>
  );
}
