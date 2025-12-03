import axios from "./axiosConfig.js";

// GET - Fetch paginated transaction history (Protected Staff Route)
export const getTransactionHistory = async (params) => {
  try {
    // Use axios.get with query parameters handled by the URL structure
    const response = await axios.get(
      `/api/staff/transaction/transactions?${params.toString()}`
    );

    if (response.status === 200 && response.data.success) {
      return response.data.data;
    } else {
      // Throw an error if the status is 200 but success: false
      throw new Error(
        response.data.message || "Failed to retrieve transaction history."
      );
    }
  } catch (error) {
    console.error("Error in fetching transaction history: ", error);
    return null;
  }
};

// GET - Fetch transaction statistics (Protected Staff Route)
export const getTransactionStats = async () => {
  try {
    // Use axios.get; base URL, token, and headers are automatic
    const response = await axios.get(`/api/staff/transaction/stats`);

    if (response.status === 200 && response.data.success) {
      return response.data.data;
    } else {
      // Throw an error if the status is 200 but success: false
      throw new Error(
        response.data.message || "Failed to retrieve transaction statistics."
      );
    }
  } catch (error) {
    console.error("Error in fetching transaction stats: ", error);
    // Returning null for local consumption, letting interceptor handle global errors
    return null;
  }
};
