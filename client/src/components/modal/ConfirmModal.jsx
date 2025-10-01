import React from 'react';
import { motion } from 'framer-motion';
import Loading from '../Loading'; // Import your Loading component

export default function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  loading = false,
  progress = 0,
  title = "Submit Request",
  description = "By confirming, your queue request will be submitted for processing.",
  cancelText = "Cancel",
  confirmText = "Confirm",
  loadingText = "Submitting...",
  overlayClickClose = true,
  showProgress = false,
  showLoading = false,
  icon = null, // New prop for icon image
  iconAlt = "Icon", // Alt text for icon
  iconSize = "w-16 h-16" // Size for icon
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
          className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Section - Only shows if icon prop is provided */}
          {icon && (
            <div className="flex justify-center mb-4">
              <img 
                src={icon} 
                alt={iconAlt} 
                className={`${iconSize} object-contain`}
              />
            </div>
          )}

          {/* Header */}
          <div className="flex justify-center items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading && showLoading}
            >
              {/* Close icon can be added here if needed */}
            </button>
          </div>
          
          {/* Description */}
          <div className="py-1">
            <p className="text-gray-600 text-center">
              {description}
            </p>
          </div>
          
          {/* Buttons */}
          <div className="mt-8 px-5 flex justify-end space-x-4 gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              disabled={loading && showLoading}
              className="px-4 py-3 border-gray-300 bg-[#F4F8FE] text-gray-700 hover:bg-gray-300 transition-colors rounded-xl w-1/2 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              disabled={loading && showLoading}
              className={`px-4 py-3 rounded-xl w-1/2 font-medium cursor-pointer transition-colors ${
                (loading && showLoading)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#1A73E8] text-white hover:bg-blue-700"
              }`}
            >
              {(loading && showLoading) ? "Submitting..." : confirmText}
            </motion.button>
          </div>
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