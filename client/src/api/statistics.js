import axios from "./axiosConfig.js";
// GET - Fetch overall Dashboard Statistics (Protected Staff Route)
export const fetchDashboardStatistics = async () => {
  try {
    // Uses axios; token and base URL handled automatically
    const response = await axios.get("/api/statistics/dashboard");

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      // Handles unexpected successful status codes or success: false payload
      return {
        success: false,
        message: response.data.message || "Failed to fetch statistics.",
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    // Error response from interceptor is handled globally, but returning a structured error locally
    return {
      success: false,
      message: error.response?.data?.message || "Internal Server Error",
    };
  }
};

// GET - Get Today's Analytics (Protected Staff Route)
export const getTodayAnalytics = async () => {
  try {
    // Uses axios; headers, token, and base URL handled automatically
    const response = await axios.get("/api/statistics/today");
    return response.data;
  } catch (error) {
    console.error("Error fetching today analytics:", error);
    throw error;
  }
};

// GET - Get Weekly Analytics (Protected Staff Route)
export const getWeeklyAnalytics = async () => {
  try {
    // Uses axios; headers, token, and base URL handled automatically
    const response = await axios.get("/api/statistics/week");
    return response.data;
  } catch (error) {
    console.error("Error fetching weekly analytics:", error);
    throw error;
  }
};

// GET - Fetch Live Queue Stats (Protected Staff Route)
export const fetchLiveDataStats = async () => {
  try {
    // Uses axios; headers, token, and base URL handled automatically
    const response = await axios.get("/api/statistics/queue/live");

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      // Handles unexpected successful status codes or success: false payload
      return {
        success: false,
        message: response.data.message || "Failed to fetch statistics.",
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    // Error response from interceptor is handled globally, but returning a structured error locally
    return {
      success: false,
      message: error.response?.data?.message || "Internal Server Error",
    };
  }
};
