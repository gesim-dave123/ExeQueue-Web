import { toast } from "sonner";

const shownMessages = new Set();

export const showToast = (message, type = "error") => {
  if (shownMessages.has(message)) return; // skip duplicate
  shownMessages.add(message);
  toast[type](message);

  // remove from set after 3 seconds (default toast duration)
  setTimeout(() => shownMessages.delete(message), 3000);
};
