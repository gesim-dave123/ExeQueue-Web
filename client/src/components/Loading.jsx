import { AnimatePresence, motion } from "framer-motion";

export default function Loading({
  text = "Loading...",
  progress = 0,
  isVisible = true,
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (!isVisible) setIsLoading(false);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50"
        >
          <div className="mb-6">
            <div className="w-16 h-16 flex items-center justify-center rounded-full">
              <img
                src="/assets/Logo.png"
                alt="Queue Logo"
                className="w-20 h-14"
              />
            </div>
          </div>

          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-[#1A73E8] transition-[width] duration-[2000ms] ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="mt-4 text-gray-700 font-medium">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
