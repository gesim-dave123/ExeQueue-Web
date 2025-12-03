import axios from "./axiosConfig.js";

// GET - Get all Working Scholars
export const getWorkingScholars = async () => {
  try {
    const response = await axios.get("/api/staff/accounts/working-scholars");
    return response.data;
  } catch (error) {
    // Response interceptor handles 401/403/500 globally
    console.error("Error fetching working scholars:", error);
    // Re-throw to allow component-level error handling (e.g., showing a message)
    throw error;
  }
};

// POST - Create a new Working Scholar
export const createWorkingScholar = async (accountData) => {
  try {
    // 1. Use axios.post
    // 2. Headers/withCredentials handled automatically
    const response = await axios.post(
      "/api/staff/accounts/working-scholars",
      accountData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating working scholar:", error);
    throw error;
  }
};

// PUT - Update an existing Working Scholar
export const updateWorkingScholar = async (sasStaffId, accountData) => {
  try {
    // Use the dynamic part of the URL
    const response = await axios.put(
      `/api/staff/accounts/working-scholars/${sasStaffId}`,
      accountData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating working scholar:", error);
    throw error;
  }
};

// DELETE - Delete a Working Scholar
export const deleteWorkingScholar = async (sasStaffId) => {
  try {
    // Use axios.delete
    // Note: DELETE requests often don't need a body, just the path.
    const response = await axios.delete(
      `/api/staff/accounts/working-scholars/${sasStaffId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting working scholar:", error);
    throw error;
  }
};
