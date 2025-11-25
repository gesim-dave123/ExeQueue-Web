import axios from "axios";
import { showToast } from "../components/toast/ShowToast";
import backendConnection from "./backendConnection.js";

export const login = async (formData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/staff/login`,
      formData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else if (error.request) {
      return { success: false, message: "No response from server" };
    } else {
      return { success: false, message: "An unexpected error occurred" };
    }
  }
};

export const sendOTPtoEmail = async (email) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/getOTP`,
      { email },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      showToast(response.data.message, "success");
      return response.data;
    } else {
      return false;
    }
  } catch (error) {
    if (error.response) {
      showToast(error.response.data.message || "Email not found", "error");
    } else if (error.request) {
      showToast("No response from server", "error");
    } else {
      showToast("An unexpected error occurred", "error");
    }
    return false;
  }
};

export const verifyOTP = async (otp, flowToken, email) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/verify-email`,
      {
        receivedOTP: otp,
        email: email,
        flowToken: flowToken,
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      showToast(response.data.message, "success");
      return {
        success: true,
        message: response.data.message,
        resetToken: response.data.resetToken, // Get token from response
      };
    }
  } catch (error) {
    if (error.response) {
      showToast(error.response.data.message || "OTP found", "error");
    } else if (error.request) {
      showToast("No response from server", "error");
    } else {
      showToast("An unexpected error occurred", "error");
    }
    return false;
  }
};

export const resetPassword = async (resetToken, newPassword) => {
  try {
    const response = await axios.patch(
      `${backendConnection()}/api/auth/reset-password`,
      { newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resetToken}`,
        },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      showToast(response.data.message, "success");
      return { success: true, message: response.data.message };
    }
  } catch (error) {
    if (error.response) {
      showToast(
        error.response.data.message || "Failed to reset password",
        "error"
      );
      return { success: false, message: error.response.data.message };
    } else if (error.request) {
      showToast("No response from server", "error");
      return { success: false, message: "No response from server" };
    } else {
      showToast("An unexpected error occurred", "error");
      return { success: false, message: "An unexpected error occurred" };
    }
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error("Error in logout: ", error.response?.data?.message);
    showToast("An error occurred when logging out!", "error");
    return false;
  }
};

export const verifyUser = async () => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/verify`,
      {},
      { withCredentials: true }
    );
    if (response.status === 200) {
      return response.data.user;
    }
  } catch (error) {
    console.error("Error in verifyUser: ", error.response?.data?.message);
    return null;
  }
};

export const forceLogout = async () => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/staff/force-logout`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else if (error.request) {
      return { success: false, message: "No response from server" };
    } else {
      return { success: false, message: "An unexpected error occurred" };
    }
  }
};

export const checkLoginStatus = async () => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/staff/check-login`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    } else if (error.request) {
      return { success: false, message: "No response from server" };
    } else {
      return { success: false, message: "An unexpected error occurred" };
    }
  }
};
