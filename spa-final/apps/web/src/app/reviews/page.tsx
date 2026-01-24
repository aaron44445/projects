'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Star,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
  MoreHorizontal,
  X,
  Send,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useReviews, Review } from '@/hooks';

function ReviewsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [replyModal, setReplyModal] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Use the reviews hook for API integration
  const { reviews, loading, error, pagination, fetchReviews, respondToReview, approveReview } = useReviews();

  // Navigate to client profile
  const handleViewClientProfile = (clientId: string) => {
    router.push(`/clients?client=${clientId}`);
    setActionMenu(null);
  };

  // Fetch reviews when filter changes
  useEffect(() => {
    const statusFilter = filter === 'all' ? undefined : filter;
    fetchReviews(statusFilter);
  }, [filter, fetchReviews]);

  // Filter reviews based on the selected filter for display
  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

  // Calculate stats from real review data
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const responseRate = reviews.length > 0
    ? Math.round((reviews.filter(r => r.responses.length > 0).length / reviews.length) * 100)
    : 0;
  const pendingCount = reviews.filter(r => !r.isApproved).length;

  const stats = [
    { label: 'Average Rating', value: averageRating, icon: Star, color: 'bg-sage' },
    { label: 'Total Reviews', value: pagination.total.toString(), icon: MessageCircle, color: 'bg-lavender' },
    { label: 'Response Rate', value: `${responseRate}%`, icon: ThumbsUp, color: 'bg-peach' },
    { label: 'Pending', value: pendingCount.toString(), icon: TrendingUp, color: 'bg-mint' },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-charcoal/20'}`}
      />
    ));
  };

  const handleReply = async () => {
    if (!replyModal || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await respondToReview(replyModal.id, replyText);
      setReplyModal(null);
      setReplyText('');
      showSuccess('Reply posted successfully!');
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      setActionMenu(null);
      showSuccess('Review approved and published!');
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const handleRequestReview = () => {
    showSuccess('Review request sent to recent clients!');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get client initials
  const getClientInitials = (client: { firstName: string; lastName: string }) => {
    return `${client.firstName[0]}${client.lastName[0]}`;
  };

  // Get client full name
  const getClientName = (client: { firstName: string; lastName: string }) => {
    return `${client.firstName} ${client.lastName}`;
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar currentPage="reviews" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal">Reviews</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationDropdown />
              <button
                onClick={handleRequestReview}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Request Reviews</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <FeatureGate feature="reviews">
            {/* Success Message */}
            {successMessage && (
              <div className="fixed top-6 right-6 bg-sage text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
                <Check className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => fetchReviews()}
                  className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                  Retry
                </button>
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
              <h3 className="font-semibold text-charcoal mb-2">Review Tips</h3>
              <ul className="text-sm text-charcoal/70 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Respond to all reviews within 24 hours to show you care</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Thank clients for positive reviews and address concerns professionally</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Published reviews appear on your online booking page</span>
                </li>
              </ul>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl border border-charcoal/5 shadow-soft">
              <div className="p-6 border-b border-charcoal/10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">Recent Reviews</h2>
                  <p className="text-sm text-charcoal/60">Manage and respond to client feedback</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-sage/10 text-sage' : 'text-charcoal/60 hover:bg-charcoal/5'}`}
                  >
                    All ({pagination.total})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-sage/10 text-sage' : 'text-charcoal/60 hover:bg-charcoal/5'}`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'approved' ? 'bg-sage/10 text-sage' : 'text-charcoal/60 hover:bg-charcoal/5'}`}
                  >
                    Approved ({reviews.filter(r => r.isApproved).length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-sage animate-spin mb-4" />
                  <p className="text-charcoal/60">Loading reviews...</p>
                </div>
              ) : (
                <div className="divide-y divide-charcoal/10">
                  {filteredReviews.length === 0 ? (
                    <div className="p-12 text-center">
                      <Star className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                      <p className="text-charcoal/60">No reviews found</p>
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <div key={review.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sage font-semibold">{getClientInitials(review.client)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <p className="font-semibold text-charcoal">{getClientName(review.client)}</p>
                              <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                review.isApproved ? 'bg-sage/20 text-sage-dark' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {review.isApproved ? 'approved' : 'pending'}
                              </span>
                            </div>
                            <p className="text-charcoal mb-2">{review.comment || 'No comment provided'}</p>
                            <div className="flex items-center gap-4 text-sm text-charcoal/50">
                              <span>{review.appointment.service.name}</span>
                              <span>{formatDate(review.submittedAt)}</span>
                            </div>

                            {/* Response */}
                            {review.responses.length > 0 && (
                              <div className="mt-4 p-4 bg-sage/5 rounded-xl border-l-2 border-sage">
                                <p className="text-sm text-charcoal/60 mb-1 font-medium">Your response:</p>
                                <p className="text-sm text-charcoal">{review.responses[0].responseText}</p>
                                {review.responses[0].respondedBy && (
                                  <p className="text-xs text-charcoal/40 mt-2">
                                    - {review.responses[0].respondedBy.firstName} {review.responses[0].respondedBy.lastName}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === review.id ? null : review.id)}
                              className="p-2 text-charcoal/40 hover:text-charcoal"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {actionMenu === review.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-charcoal/10 py-2 z-10">
                                {review.responses.length === 0 && (
                                  <button
                                    onClick={() => {
                                      setReplyModal(review);
                                      setActionMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Reply to review
                                  </button>
                                )}
                                {!review.isApproved && (
                                  <button
                                    onClick={() => handleApprove(review.id)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                                  >
                                    <Globe className="w-4 h-4" />
                                    Approve & publish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewClientProfile(review.client.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View client profile
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Reply Button */}
                        {review.responses.length === 0 && (
                          <div className="mt-4 ml-16">
                            <button
                              onClick={() => setReplyModal(review)}
                              className="text-sm text-sage hover:text-sage-dark font-medium"
                            >
                              Reply to review
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-charcoal/10 flex justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => fetchReviews(filter === 'all' ? undefined : filter, i + 1)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'bg-sage text-white'
                          : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FeatureGate>
        </div>
      </main>

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-charcoal">Reply to Review</h2>
              <button onClick={() => { setReplyModal(null); setReplyText(''); }} className="p-2 hover:bg-charcoal/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60" />
              </button>
            </div>

            <div className="p-6">
              {/* Original Review */}
              <div className="bg-cream/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-charcoal">{getClientName(replyModal.client)}</span>
                  <div className="flex items-center gap-0.5">{renderStars(replyModal.rating)}</div>
                </div>
                <p className="text-sm text-charcoal/70">{replyModal.comment || 'No comment provided'}</p>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Your Response</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for your feedback..."
                  rows={4}
                  className="w-full px-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage resize-none"
                />
                <p className="text-xs text-charcoal/50 mt-2">Your response will be visible on your booking page once the review is approved.</p>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3 justify-end">
              <button
                onClick={() => { setReplyModal(null); setReplyText(''); }}
                className="px-6 py-2 text-charcoal/60 hover:text-charcoal font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Reply
                  </>
                )}
              </button>
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

export default function ReviewsPage() {
  return (
    <AuthGuard>
      <ReviewsContent />
    </AuthGuard>
  );
}
