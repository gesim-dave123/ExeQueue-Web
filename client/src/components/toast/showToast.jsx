import { toast } from "sonner";

// Track active toasts and their counts
const activeToasts = new Map(); // { message: { toastId, count, timeoutId } }

export const showToast = (message, type = "error") => {
  const existing = activeToasts.get(message);

  if (existing) {
    // Dismiss the old toast using toast.dismiss()
    toast.dismiss(existing.toastId);

    // Clear existing timeout
    clearTimeout(existing.timeoutId);

    // Increment count and show new toast with count
    const newCount = existing.count + 1;
    const toastId = toast[type](`${message} (${newCount})`);

    // Set new timeout for cleanup
    const timeoutId = setTimeout(() => {
      activeToasts.delete(message);
    }, 3000);

    activeToasts.set(message, { toastId, count: newCount, timeoutId });
  } else {
    // Create new toast (returns the toast ID)
    const toastId = toast[type](message);

    // Set timeout for cleanup
    const timeoutId = setTimeout(() => {
      activeToasts.delete(message);
    }, 1000);

    // Store toast reference
    activeToasts.set(message, { toastId, count: 1, timeoutId });
  }
};
