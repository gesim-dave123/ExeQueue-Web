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
export const getQueueListByStatus = async (status, options = {}) => {
  try {
    const {
      limit = 100,
      offset = 0,
      include_total = false,
      windowId,
      requestStatus,
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      status,
      limit: limit.toString(),
      offset: offset.toString(),
      include_total: include_total.toString(),
      ...(windowId && { windowId: windowId.toString() }),
      ...(requestStatus && { requestStatus }),
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
    console.error("Error in getQueuesByStatus:", error);

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
    if (error.response) {
      return error.response.data;
      ssage;
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
    console.error("An error occured in Call Next Api", error);
    return response.data.error;
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
    console.error("An error occured in Call Next Api", error);
    return response.data.error;
  }
};

export const markQueueStatus = async (queueId, windowId) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/api/staff/queue/${queueId}/${windowId}/mark-status`,
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
    console.error("An error occured in Mark Queue Status Api", error);
    return response.data.error;
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
    console.error("An error occured in Current Served Queue Api", error);
    return response.data.error;
  }
};

export const getQueueByStatusAndWindow = async (status, windowId) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?status=${status}&windowId=${windowId}`,
      {},
      {
        headers: {
          "Content-Type": "application/type",
        },
        withCredentials: true,
      }
    );
    // Correct condition - check if status is 200 AND success is true
    if (response.status === 200 && response.data.success) {
      console.log("Queue List:", response.data.queueList);
      return response.data.queueList;
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error in getQueueListByStatus:", error);
    return [];
  }
};
export const getDeferredQueue = async (status) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?status=${status}&requestStatus=STALLED,SKIPPED`,
      {},
      {
        headers: {
          "Content-Type": "application/type",
        },
        withCredentials: true,
      }
    );
    // Correct condition - check if status is 200 AND success is true
    if (response.status === 200 && response.data.success) {
      console.log("Queue List:", response.data.queueList);
      return response.data.queueList;
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error in getQueueListByStatus:", error);
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
    console.error("Error in getQueueListByStatus:", error);
    return null;
  }
};
