import { motion } from "framer-motion";
import { X } from "lucide-react";
import Loading from "../Loading";

export default function DynamicModal({
  isOpen = false,
  onClose,
  loading = false,
  progress = 0,

  // 🔹 Text Content
  title = "Modal Title",
  titleClassName = "text-2xl font-semibold text-gray-800 text-center mb-4",
  description = "Modal description goes here.",
  descriptionClassName = "text-gray-600 text-center",

  // 🔹 Behavior
  overlayClickClose = true,
  showProgress = false,
  showLoading = false,
  hideActions = false,
  showCloseButton = true,

  // 🔹 Icon
  icon = null,
  iconAlt = "Icon",
  iconSize = "w-16 h-16",

  // 🔹 Dynamic Content
  children = null,
  buttons = [], // Array of { text, onClick, className, loading, loadingText }
  buttonLayout = "horizontal", // 'horizontal' | 'vertical' | 'grid'
  customContent = null,

  // 🔹 Styling
  // modalWidth = "max-w-md",
  // modalHeight = "max-h-md",
  modalWidth = "max-w-sm",
  modalHeight = "h-auto",
  contentClassName = "",
  modalClassName = "",

  // 🔹 Loading Text
  loadingText = "Processing...",
}) {
  if (!isOpen) return null;

  // 🔹 Button layout presets
  const getButtonLayoutClass = () => {
    switch (buttonLayout) {
      case "vertical":
        return "flex flex-col space-y-3";
      case "grid":
        return "grid grid-cols-2 gap-3";
      case "horizontal-center":
        return "flex justify-center space-x-3";
      case "horizontal-space-between":
        return "flex justify-between space-x-3";
      case "horizontal-wrap":
        return "flex flex-wrap justify-center gap-3";
      default: // horizontal
        return "flex items-center space-x-3"; // Default to left-aligned
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        onClick={overlayClickClose ? onClose : undefined}
      >
        {/* Modal Body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`bg-white rounded-2xl shadow-xl p-10 flex flex-col justify-around ${modalWidth} ${modalHeight} relative ${modalClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              disabled={loading && showLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X size={25} />
            </button>
          )}

          {/* Icon */}
          {icon && (
            <div className="flex justify-center mb-4">
              <img
                src={icon}
                alt={iconAlt}
                className={`${iconSize} object-contain`}
              />
            </div>
          )}

          {/* Title */}
          {title && <h3 className={titleClassName}>{title}</h3>}

          {/* Description */}
          {description && (
            <div className="py-1">
              <p className={descriptionClassName}>{description}</p>
            </div>
          )}

          {/* Custom Content (children or JSX) */}
          {children && (
            <div className={`mt-4 ${contentClassName}`}>{children}</div>
          )}
          {customContent && (
            <div className={contentClassName}>{customContent}</div>
          )}

          {/* Action Buttons */}
          {!hideActions && buttons.length > 0 && (
            <div className={`mt-6 ${getButtonLayoutClass()}`}>
              {" "}
              {/* Reduced mt-8 to mt-6 */}
              {buttons.map((button, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95 }}
                  onClick={button.onClick}
                  disabled={button.disabled || (loading && showLoading)}
                  className={`
                    px-4 py-3 rounded-xl font-medium cursor-pointer transition-colors text-sm
                    disabled:cursor-not-allowed flex-1 min-w-0
                    ${button.className || ""}
                  `}
                >
                  {button.loading
                    ? button.loadingText || "Loading..."
                    : button.text}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Global Loading Overlay */}
      {loading && showLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loading text={loadingText} progress={progress} />
        </div>
      )}
    </>
  );
}
