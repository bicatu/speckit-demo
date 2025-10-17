import React, { useState } from 'react';

interface RatingInputProps {
  /** Current rating value (1-10), or null if not rated */
  currentRating: number | null;
  /** Callback when user submits a rating */
  onSubmit: (stars: number) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Optional error message to display */
  error?: string | null;
}

/**
 * Rating input component with star selector (1-10 stars)
 * Allows users to add or update their personal rating for an entry
 */
export function RatingInput({ currentRating, onSubmit, isSubmitting = false, error = null }: RatingInputProps) {
  const [selectedStars, setSelectedStars] = useState<number>(currentRating || 5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedStars);
  };

  const displayStars = hoveredStars !== null ? hoveredStars : selectedStars;

  return (
    <div style={{ backgroundColor: '#f9f9f9', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
        {currentRating ? 'Your Rating' : 'Rate This Entry'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Star Selector */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              fontSize: '32px',
              marginBottom: '8px',
            }}
            onMouseLeave={() => setHoveredStars(null)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStars(star)}
                onMouseEnter={() => setHoveredStars(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: star <= displayStars ? '#FFD700' : '#ddd',
                  transition: 'color 0.1s ease',
                  fontSize: '32px',
                  lineHeight: 1,
                }}
                aria-label={`Rate ${star} stars`}
                disabled={isSubmitting}
              >
                ★
              </button>
            ))}
          </div>

          <div style={{ fontSize: '16px', color: '#666', textAlign: 'center' }}>
            {displayStars} {displayStars === 1 ? 'star' : 'stars'}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: isSubmitting ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#1565c0';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#1976d2';
            }
          }}
        >
          {isSubmitting ? 'Submitting...' : currentRating ? 'Update Rating' : 'Submit Rating'}
        </button>
      </form>

      {currentRating && (
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          Current rating: {currentRating} {currentRating === 1 ? 'star' : 'stars'}
        </div>
      )}
    </div>
  );
}
