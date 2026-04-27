import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | string;
  ticketNumber: string;
  onSuccess?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Silakan pilih rating terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`tickets/${ticketId}/feedback`, {
        rating,
        feedback_text: feedbackText || null,
      });

      toast.success('Terima kasih atas feedback Anda!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error?.response?.data?.message || 'Gagal mengirim feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRating(0);
    setHoveredRating(0);
    setFeedbackText('');
    onClose();
  };

  const handleSkip = () => {
    if (rating === 0 && !feedbackText.trim()) {
      toast.info('Anda bisa mengisi feedback nanti melalui tombol di halaman detail tiket.', {
        duration: 4000,
      });
    }
    handleClose();
  };

  const ratingDescriptions = [
    '',
    'Sangat Tidak Memuaskan',
    'Kurang Memuaskan',
    'Cukup Memuaskan',
    'Memuaskan',
    'Sangat Memuaskan'
  ];

  const ratingColors = [
    'text-slate-200',
    'text-red-400',
    'text-orange-400',
    'text-yellow-400',
    'text-emerald-400',
    'text-blue-500'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-slate-200 rounded-xl shadow-xl bg-white">
        {/* Header - Consistent with Ticket Detail Cards */}
        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-blue-500 fill-blue-500" />
              <DialogTitle className="text-lg font-bold text-slate-800">
                Berikan Feedback & Rating
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 text-sm">
              Bagaimana pengalaman Anda dengan layanan untuk tiket <span className="text-slate-900 font-semibold">#{ticketNumber}</span>?
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Rating Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Rating Kepuasan
            </label>
            
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  className="relative transition-transform active:scale-95 outline-none"
                >
                  <Star
                    className={`h-9 w-9 transition-colors duration-150 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              
              <AnimatePresence mode="wait">
                {rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className={`text-xs font-bold uppercase tracking-tight ml-2 ${ratingColors[rating]}`}
                  >
                    {ratingDescriptions[rating]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageSquareHeart className="h-3.5 w-3.5 text-blue-500" />
              <label htmlFor="feedback-text" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Komentar Tambahan <span className="opacity-50 font-normal lowercase">(Opsional)</span>
              </label>
            </div>
            <div className="relative group">
              <Textarea
                id="feedback-text"
                placeholder="Ceritakan pengalaman Anda atau berikan saran perbaikan..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                maxLength={1000}
                disabled={isSubmitting}
                className="resize-none rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100 transition-all text-sm leading-relaxed p-4"
              />
              <div className="absolute bottom-2 right-3 text-[9px] font-mono text-slate-300">
                {feedbackText.length}/1000
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <DialogFooter className="p-6 pt-0 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs px-4"
          >
            Lewati
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-10 rounded-lg shadow-sm transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Kirim Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

