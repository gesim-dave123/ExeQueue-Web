import axios from "axios";
import backendConnection from "./backendConnection.js";

export const studentsQueueDetails = async (queueDetails) => {
  try {
    if (!queueDetails) throw new Error("Queue Details is Empty!");

    const response = await axios.post(
      `${backendConnection()}/api/queue/generate`,
      queueDetails,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    if (response.data.success && response.status === 201) {
      return {
        success: true,
        message: "Queue Generated",
        queueDetails: response.data.queueData,
      };
    }
  } catch (error) {
    console.error("Error in Generating Queue: ", error);
    return {
      success: false,
      message: "Internal Server Error",
      queueDetails: null,
    };
  }
};
export const getQueueListByQuery = async (status, options = {}) => {
  try {
    const {
      limit = 100,
      offset = 0,
      include_total = false,
      windowId,
      requestStatus,
      searchValue,
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      status,
      limit: limit.toString(),
      offset: offset.toString(),
      include_total: include_total.toString(),
      ...(windowId && { windowId: windowId.toString() }),
      ...(requestStatus && { requestStatus }),
      ...(searchValue && { search: searchValue.toString() }),
    });

    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    // Check if response is successful AND has success: true
    if (response.status === 200 && response.data.success) {
      console.log(
        "Queues retrieved successfully:",
        response.data.queues?.length || 0,
        "items"
      );
      return response.data; // Return full response to access queues, pagination, etc.
    } else {
      console.warn("Unexpected response format:", response.data);
      return {
        success: false,
        queues: [],
        message: response.data?.message || "Unexpected response format",
      };
    }
  } catch (error) {
    console.error("Error in getQueueListByQuery:", error);

    // Return structured error response
    return {
      success: false,
      queues: [],
      message: error.response?.data?.message || "Failed to fetch queues",
      error: error.message,
    };
  }
};
export const getCallNextQueue = async (windowId) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/api/staff/queue/call/${windowId}`,
      {}, // ✅ Empty body object
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    if (response?.status === 200 && response?.data.success) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error in Call Next Queue:", error);
    // ✅ Fixed: use error.response instead of response
    if (error.response) {
      return error.response.data;
    }
    return { success: false, message: "Network error." };
  }
};

export const setRequestStatus = async (
  queueId,
  requestId,
  requestStatus,
  windowId
) => {
  try {
    console.log("Request Id in API:", requestId);
    const response = await axios.put(
      `${backendConnection()}/api/staff/queue/set/status/${queueId}/${requestId}/${requestStatus}/${windowId}`,
      {}, // ✅ Empty body object
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response?.status === 200 && response?.data.success) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error in setRequestStatus:", error);
    // ✅ Fixed: use error.response instead of response
    if (error.response?.data) {
      return error.response.data;
    }
    return { 
      success: false, 
      message: error.message || "Failed to update request status" 
    };
  }
};

export const setDeferredRequestStatus = async (
  queueId,
  requestId,
  requestStatus,
  windowId
) => {
  try {
    console.log("Request Id in API:", requestId);
    const response = await axios.put(
      `${backendConnection()}/api/staff/queue/set/status/deferred/${queueId}/${requestId}/${windowId}/${requestStatus}`,
      {}, // ✅ Empty body object
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response?.status === 200 && response?.data.success) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error in setDeferredRequestStatus:", error);
    // ✅ Fixed: use error.response instead of response
    if (error.response?.data) {
      return error.response.data;
    }
    return { 
      success: false, 
      message: error.message || "Failed to update deferred request status" 
    };
  }
};

export const markQueueStatus = async (queueId, windowId) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/api/staff/queue/${queueId}/${windowId}/mark-status`,
      {}, // ✅ Empty body object
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    console.log("Response from api", response);
    
    if (response?.status === 200 && response?.data.success) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error in markQueueStatus:", error);
    // ✅ Fixed: use error.response instead of response
    if (error.response?.data) {
      return error.response.data;
    }
    return { 
      success: false, 
      message: error.message || "Failed to mark queue status" 
    };
  }
};

export const currentServedQueue = async (windowId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/current/window/${windowId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    console.log("Response from api", response);
    
    if (response?.status === 200 && response?.data.success) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error in currentServedQueue:", error);
    // ✅ Fixed: use error.response instead of response
    if (error.response?.data) {
      return error.response.data;
    }
    return { 
      success: false, 
      message: error.message || "Failed to get current served queue" 
    };
  }
};

export const getQueueByStatusAndWindow = async (status, windowId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?status=${status}&windowId=${windowId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    if (response.status === 200 && response.data.success) {
      console.log("Queue List:", response.data.queueList);
      return response.data.queueList;
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error in getQueueByStatusAndWindow:", error);
    return [];
  }
};

export const getDeferredQueue = async (status) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?status=${status}&requestStatus=STALLED,SKIPPED`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    if (response.status === 200 && response.data.success) {
      console.log("Deferred Response Api", response.data.queueList);
      return response.data.queueList;
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error in getDeferredQueue:", error);
    return [];
  }
};

export const getSingleQueue = async (queueId, options = {}) => {
  try {
    const { status, windowId, requestStatus, referenceNumber } = options;

    // Build query parameters
    const params = new URLSearchParams({
      ...(referenceNumber && { referenceNumber: referenceNumber }),
      ...(status && { status: status }),
      ...(windowId && { windowId: windowId.toString() }),
      ...(requestStatus && { requestStatus }),
    });

    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/one/${queueId}/?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    if (response.status === 200 && response.data.success) {
      return response.data.queue;
    } else {
      console.warn("Unexpected response format:", response.data);
      return response.data.message;
    }
  } catch (error) {
    console.error("Error in getSingleQueue:", error);
    return null;
  }
};
