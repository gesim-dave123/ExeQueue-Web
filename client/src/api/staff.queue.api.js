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
        queueDetails: response.data.queueDetails,
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
export const getQueueListByStatus = async (status) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/queue/list?status=${status}`,
      {},
      {
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
    console.error("An error occured in Call Next Api", error);
    return response.data.error;
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
