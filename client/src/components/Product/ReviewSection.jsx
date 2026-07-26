import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../apiConfig';

const ReviewSection = ({ productId, reviews = [], onReviewAdded }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if current user has already reviewed
  const userHasReviewed = isAuthenticated && reviews && Array.isArray(reviews) && reviews.some(r => String(r.userId) === String(user?.id));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please add a comment');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await axios.post(
        `${API_URL}/products/${productId}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Thank you! Your review has been published.');
      setComment('');
      setRating(5);
      if (onReviewAdded) onReviewAdded(res.data.product);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="font-playfair text-xl font-bold tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-luxury-gold-500" />
        Customer Reviews ({reviews ? reviews.length : 0})
      </h3>

      {/* Review List */}
      <div className="space-y-6">
        {(!reviews || reviews.length === 0) ? (
          <p className="text-neutral-500 text-sm">There are no reviews for this product yet. Be the first to share your experience!</p>
        ) : (
          reviews.map((rev, i) => (
            <div key={i} className="border-b border-neutral-100 dark:border-neutral-900 pb-5 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                  {rev.userName || 'Verified Buyer'}
                </h5>
                <span className="text-neutral-400 text-xs">
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </span>
              </div>
              <div className="flex text-luxury-gold-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < Number(rev.rating) ? 'fill-luxury-gold-500' : 'text-neutral-200 dark:text-neutral-800'
                    }`}
                  />
                ))}
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Review Form */}
      <div className="bg-neutral-50 dark:bg-neutral-950 p-6 rounded-xl border border-neutral-100 dark:border-neutral-900 mt-10">
        <h4 className="font-playfair text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
          Write a Review
        </h4>
        
        {!isAuthenticated ? (
          <p className="text-neutral-500 text-sm">
            Please <a href="/login" className="text-luxury-gold-500 underline font-semibold">login</a> to write a review for this product.
          </p>
        ) : userHasReviewed ? (
          <p className="text-neutral-500 text-sm">
            You have already reviewed this product. Thank you for your feedback!
          </p>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            
            {/* Rating Stars Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-luxury-gold-500 text-luxury-gold-500 animate-pulse'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment field */}
            <div>
              <label htmlFor="comment" className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">
                Review Comments
              </label>
              <textarea
                id="comment"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your experience with this item..."
                className="w-full text-sm p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold-500 focus:border-luxury-gold-500"
              ></textarea>
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            {success && <p className="text-green-500 text-xs font-medium">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-black dark:bg-white text-white dark:text-black font-semibold text-xs tracking-widest uppercase py-3 px-6 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
