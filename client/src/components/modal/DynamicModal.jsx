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
  titleClassName = "text-2xl px- font-semibold text-gray-800 text-center mb-4",
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
  buttons = [],
  buttonLayout = "horizontal",
  customContent = null,

  // 🔹 Styling
  modalHeight = "h-auto",
  contentClassName = "",
  modalClassName = "",

  // 🔹 Loading Text
  loadingText = "Processing...",
}) {
  if (!isOpen) return null;

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
      default:
        return "flex items-center space-x-3";
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        onClick={overlayClickClose ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`bg-white rounded-3xl shadow-xl px-7 lg:px-9  py-12 flex flex-col justify-around w-full sm:w-[320px] md:w-[380px] lg:w-[450px] ${modalHeight} relative ${modalClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              disabled={loading && showLoading}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X size={25} />
            </button>
          )}

          {icon && (
            <div className="flex justify-center mb-4">
              <img
                src={icon}
                alt={iconAlt}
                className={`${iconSize} object-contain`}
              />
            </div>
          )}

          {title && <h3 className={titleClassName}>{title}</h3>}

          {description && (
            <div className="py-1">
              <p className={descriptionClassName}>{description}</p>
            </div>
          )}

          {children && <div className={`mt-4 ${contentClassName}`}>{children}</div>}
          {customContent && <div className={contentClassName}>{customContent}</div>}

          {!hideActions && buttons.length > 0 && (
            <div className={`mt-6 ${getButtonLayoutClass()}`}>
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
                  {button.loading ? button.loadingText || "Loading..." : button.text}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {loading && showLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loading text={loadingText} progress={progress} />
        </div>
      )}
    </>
  );
}
