import { useState } from 'react';
import { Modal } from './ui';
import { Star } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function StarDisplay({ value, size = 16, className = '' }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <span className={clsx('inline-flex items-center gap-0.5', className)}>
      {stars.map(s => (
        <Star
          key={s}
          size={size}
          className={s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </span>
  );
}

export default function RatingModal({ isOpen, onClose, application, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      const result = await api.rateApplication(application._id, { rating, feedback });
      toast.success('Thank you for your feedback!');
      onRated?.(result.application);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Experience">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* App info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium text-slate-800 dark:text-slate-200">{application?.service?.name || 'Service'}</p>
          <p className="text-slate-500 text-xs">{application?.applicationId}</p>
          {application?.assignedEmployee && (
            <p className="text-slate-500 text-xs mt-1">CA: <span className="font-medium text-slate-700 dark:text-slate-300">{application.assignedEmployee.name}</span></p>
          )}
        </div>

        {/* Stars */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  size={36}
                  className={clsx(
                    'transition-colors',
                    s <= (hover || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  )}
                />
              </button>
            ))}
          </div>
          <p className={clsx('text-sm font-semibold h-5 transition-all', (hover || rating) ? 'text-amber-500' : 'text-transparent')}>
            {labels[hover || rating]}
          </p>
        </div>

        {/* Feedback */}
        <div>
          <label className="label">Feedback <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            placeholder="Share your experience with the service and CA…"
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!rating || submitting}>
            {submitting ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
