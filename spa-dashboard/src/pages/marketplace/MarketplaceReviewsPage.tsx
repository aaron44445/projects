import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, MarketplaceReview, PaginationMeta } from '../../lib/api';

const STATUS_OPTIONS = ['all', 'published', 'pending', 'hidden'];

export default function MarketplaceReviewsPage() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviews();
  }, [statusFilter, page]);

  async function loadReviews() {
    try {
      setLoading(true);
      setError('');
      const result = await api.getMarketplaceReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      });
      setReviews(result.reviews);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(reviewId: string, newStatus: string) {
    try {
      setUpdating(reviewId);
      await api.updateMarketplaceReviewStatus(reviewId, newStatus);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <Link
          to="/marketplace"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Marketplace
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm rounded-lg capitalize ${
                statusFilter === status
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No reviews found
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-lg p-6 ${
                review.status === 'hidden' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    {review.isVerified && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Verified
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                        review.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : review.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="font-semibold text-gray-900 mb-1">{review.title}</h3>
                  )}

                  {review.comment && (
                    <p className="text-gray-600 mb-3">{review.comment}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{review.reviewerName}</span>
                    {review.reviewerEmail && <span>{review.reviewerEmail}</span>}
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {updating === review.id ? (
                    <span className="text-sm text-gray-500">Updating...</span>
                  ) : (
                    <>
                      {review.status !== 'published' && (
                        <button
                          onClick={() => handleStatusUpdate(review.id, 'published')}
                          className="px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                        >
                          Publish
                        </button>
                      )}
                      {review.status !== 'hidden' && (
                        <button
                          onClick={() => handleStatusUpdate(review.id, 'hidden')}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          Hide
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} reviews
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
