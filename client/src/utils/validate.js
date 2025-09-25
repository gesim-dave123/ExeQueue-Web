import CryptoJS from "crypto-js";

export function validateAccess() {
  const accessKey = import.meta.env.VITE_ACCESS_KEY;
  const accessKeyHash = import.meta.env.VITE_ACCESS_KEY_HASH;

  if (!accessKey || !accessKeyHash) {
    throw new Error("Missing credentials! Cannot run app.");
  }

  const hash = CryptoJS.MD5(accessKey).toString();
  // console.log("Computed Hash:", hash); // Debugging line
  if (hash !== accessKeyHash) {
    throw new Error("Invalid access key! Stopping app.");
  }

  console.log("Frontend access validated!");
}