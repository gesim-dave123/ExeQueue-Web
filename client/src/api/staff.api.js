import axios from "axios";
import backendConnection from "./backendConnection.js";

// GET - Get Window Data
export const getWindowData = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/window/get`,
      {},
      {
        // headers: {
        //   "Authorization" : `Bearer: ${token}`
        // }
        withCredentials: true,
      }
    );
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
    const response = await axios.post(
      `${backendConnection()}/api/staff/window/check`,
      { windowIds },
      {
        // headers: {
        //   "Authorization" : `Bearer: ${token}`
        // }
        withCredentials: true,
      }
    );
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
