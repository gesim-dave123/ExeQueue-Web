import axios from "./axiosConfig.js";
export const getWindowData = async () => {
  try {
    // The interceptor's baseURL handles the domain, and the token is auto-added
    const response = await axios.get("/api/staff/window/get");

    if (response.status === 200 && response.data.success) {
      return {
        windows: response.data.windows,
      };
    }
  } catch (error) {
    console.error("Error Occured in Get Window Api: ", error);
    return null;
  }
};

export const checkAvailableWindow = async (windowIds) => {
  try {
    // Use axios instead of axios.post
    const response = await axios.post("/api/staff/window/check", { windowIds });

    if (response.status === 200 && response.data.success) {
      return response.data;
    } else {
      console.warn("Unexpected API response:", response.data);
      return { availableWindows: [] };
    }
  } catch (error) {
    console.error("Error Occured in Check Available Window api: ", error);
    return null;
  }
};

export const assignServiceWindow = async (windowId) => {
  try {
    // Note the cleaner POST call. No need for the empty data object or config.
    const response = await axios.post(`/api/staff/window/${windowId}/assign`);
    return response.data;
  } catch (error) {
    console.error("Error assigning window:", error);
    // The response interceptor handles the global error, but this handles local message formatting
    return {
      success: false,
      message: error.response?.data?.message || "Failed to assign window",
    };
  }
};

export const releaseServiceWindow = async () => {
  try {
    // Use axios.put
    const response = await axios.put("/api/staff/window/release");

    if (
      response.status === 200 &&
      response.data.success &&
      response.data.wasWindowAssigned
    ) {
      return response.data;
    } else if (!response.data.wasWindowAssigned) {
      return response.data;
    } else {
      return response.data.error;
    }
  } catch (error) {
    console.error("Error releasing window:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to release window",
    };
  }
};

export const getMyWindowAssignment = async () => {
  try {
    // Use axios.get
    const response = await axios.get("/api/staff/window/get/own");
    return response.data;
  } catch (error) {
    console.error("Error getting window assignment:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to get assignment",
      assignment: null,
    };
  }
};

export const overrideQueueNumberReset = async (queueType) => {
  try {
    // Use axios.put
    const response = await axios.put(
      `/api/staff/queue/reset/${queueType.toString()}`
    );

    if (response.status === 200 && response.data.success) {
      return response.data;
    } else if (!response.data.activeSessionFound) {
      return response.data;
    } else {
      throw new Error(response.data.error);
    }
  } catch (error) {
    console.error("Error in manual override api: ", error);
    return null;
  }
};

export const overrideSessionReset = async () => {
  try {
    // Use axios.put
    const response = await axios.put("/api/staff/session/reset");

    if (response.status === 200 && response.data.success) {
      return response.data;
    } else if (!response.data.activeSessionFound) {
      return response.data;
    } else {
      throw new Error(response.data.error);
    }
  } catch (error) {
    console.error("Error in manual session override  api: ", error);
    return null;
  }
};

export const overrideWindowRelease = async (windowNum) => {
  try {
    // Use axios.put
    const response = await axios.put(`/api/staff/window/release/${windowNum}`);

    if (
      response.status === 200 &&
      response.data.success &&
      response.data.wasWindowAssigned
    ) {
      return response.data;
    } else if (!response.data.wasWindowAssigned) {
      return response.data;
    } else {
      return response.data.message;
    }
  } catch (error) {
    console.error("Error in manual release window override api: ", error);
    return null;
  }
};

export const updateHeartbeatInterval = async (windowId) => {
  try {
    // Use axios.put
    const response = await axios.put("/api/staff/window/update/heartbeat", {
      windowId,
    });
    if (response?.status === 200 && response?.data.success) {
      return response.data;
    } else {
      return response.data.message;
    }
  } catch (error) {
    console.error("Error in update last heartbeat api: ", error);
    return null;
  }
};

export const updateAdminProfile = async (accountData) => {
  try {
    // Use axios.put
    const response = await axios.put("/api/staff/personnel/profile-setting", {
      accountData,
    });
    return response.data;
  } catch (error) {
    // The response interceptor handles the global error, but this is fine for specific local catch
    if (error.response) {
      return error.response.data;
    } else if (error.request) {
      return { success: false, message: "No response from server" };
    } else {
      return { success: false, message: "An unexpected error occurred" };
    }
  }
};
