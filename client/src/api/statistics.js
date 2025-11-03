import axios from "axios";
import backendConnection from "./backendConnection.js";

export const fetchDashboardStatistics = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/statistics/dashboard`,
      {
        withCredentials: true,
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to fetch statistics.",
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

export const getTodayAnalytics = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/statistics/today`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching today analytics:", error);
    throw error;
  }
};

export const getWeeklyAnalytics = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/statistics/week`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching weekly analytics:", error);
    throw error;
  }
};

export const fetchLiveDataStats = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/statistics/queue/live`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to fetch statistics.",
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};
