import axios from "axios";
import backendConnection from "./backendConnection.js";

// Api to submit Queue Details
export const generateQueue = async (queueDetails) => {
  try {
    if (!queueDetails) throw new Error("Queue Details is Empty!");

    const response = await axios.post(
      `${backendConnection()}/api/student/queue/generate`,
      queueDetails,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    if (response.data.success && response.status === 201) {
      console.log("✅ Queue created successfully", response.data);

      return {
        success: true,
        message: "Queue Generated",
        queueData: response.data.queueData,
      };
    } else {
      console.error("❌ Backend error:", response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error("Error in Generating Queue:", error);
    return { success: false, message: error.message };
  }
};
// Api to get Course Data
export const getCourseData = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/student/courses`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.status) {
      return {
        courseData: response.data.courseData,
      };
    }
  } catch (error) {
    console.error("Error in Course Api (GET): ", error);
    showToast(error, "error");
  }
};
// Api to get Request Types
export const getRequestType = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/student/requests`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.status === 200) {
      return {
        requestType: response.data.requestType,
      };
    }
  } catch (error) {
    console.error("Error in fetching request-type data: ", error);
    showToast(error, "error");
  }
};

export const getQueueDisplay = async (referenceNumber) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/student/queue/${referenceNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.status === 200) {
      return {
        success: true,
        data: response.data.data,
      };
    }
  } catch (error) {
    console.error("Error fetching display queue:", error);
    return { success: false, data: null };
  }
};

export const searchQueue = async (searchParams) => {
  try {
    // searchParams should be { studentId: '2021-12345' } or { referenceNumber: '20251013-S1-R-0009' }
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await axios.get(
      `${backendConnection()}/api/student/queue/search?${queryString}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error searching queue:", error);
    throw error;
  }
};
