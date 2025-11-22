import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Loading from '../Loading';

export default function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  loading = false,
  progress = 0,
  title = "Submit Request",
  titleClassName = "text-2xl font-semibold text-gray-800 text-center mb-4",
  description = "By confirming, your queue request will be submitted for processing.",
  descriptionClassName = "text-gray-600 text-center",
  cancelText = "Cancel",
  confirmText = "Confirm",
  loadingText = "Submitting...",
  overlayClickClose = true,
  showProgress = false,
  showLoading = false,
  hideActions = false,
  showCloseButton = true,
  icon = null,
  iconAlt = "Icon",
  iconSize = "w-16 h-16",
  
  // 🔹 New Props
  cancelButtonClass = "px-4 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl w-1/2 font-medium cursor-pointer",
  confirmButtonClass = "px-4 py-3 bg-[#1A73E8] text-white hover:bg-[#1456AE] rounded-xl w-1/2 font-medium cursor-pointer",
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed text-center inset-0 shadow-xl bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-xs border"
        onClick={overlayClickClose ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ❌ Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading && showLoading}
            >
              <X size={25} />
            </button>
          )}

          {/* Icon */}
          {icon && (
            <div className="flex justify-center mb-4">
              <img src={icon} alt={iconAlt} className={`${iconSize} object-contain`} />
            </div>
          )}

          {/* Title */}
          <h3 className={titleClassName}>{title}</h3>

          {/* Description */}
          <div className="py-1">
            <p className={descriptionClassName}>{description}</p>
          </div>

          {/* Action Buttons */}
          {!hideActions && (
            <div className="mt-8 px-5 flex justify-end space-x-4 gap-4">
              {cancelText && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  disabled={loading && showLoading}
                  className={`${cancelButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {cancelText}
                </motion.button>
              )}

              {confirmText && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  disabled={loading && showLoading}
                  className={`${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(loading && showLoading) ? loadingText : confirmText}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Loading Overlay */}
      {loading && showLoading && (
        <div className="fixed inset-0 z-50">
          <Loading text={loadingText} progress={progress} />
        </div>
      )}
    </>
  );
}
