import axios from "../api/axiosConfig.js"; // Import configured instance
import { showToast } from "../components/toast/ShowToast.jsx";

export const login = async (formData) => {
  try {
    const response = await axios.post("/api/auth/staff/login", formData);

    // Store token for mobile fallback
    if (response.data.success && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }

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
    const response = await axios.post("/api/auth/getOTP", { email });

    if (response.status === 200) {
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
    const response = await axios.post("/api/auth/verify-email", {
      receivedOTP: otp,
      email: email,
      flowToken: flowToken,
    });

    if (response.status === 200) {
      showToast(response.data.message, "success");
      return {
        success: true,
        message: response.data.message,
        resetToken: response.data.resetToken,
      };
    } else {
      return false;
    }
  } catch (error) {
    if (error.response) {
      showToast(
        error.response.data.message || "OTP verification failed",
        "error"
      );
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
      "/api/auth/reset-password",
      { newPassword },
      {
        headers: {
          Authorization: `Bearer ${resetToken}`, // Manual token for password reset
        },
      }
    );

    if (response.status === 200) {
      return { success: true, message: response.data.message };
    } else {
      return false;
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
    const response = await axios.post("/api/auth/logout", {});

    // Clear token from localStorage
    localStorage.removeItem("auth_token");

    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    // Still clear token even if API call fails
    localStorage.removeItem("auth_token");
    console.error("Error in logout:", error.response?.data?.message);
    showToast("An error occurred when logging out!", "error");
    return false;
  }
};

export const verifyUser = async () => {
  try {
    const response = await axios.post("/api/auth/verify", {});
    if (response.status === 200) {
      return response.data.user;
    }
  } catch (error) {
    console.error("Error in verifyUser:", error.response?.data?.message);
    return null;
  }
};

export const forceLogout = async () => {
  try {
    const response = await axios.post("/api/auth/staff/force-logout", {});

    // Clear token on force logout
    localStorage.removeItem("auth_token");

    return response.data;
  } catch (error) {
    localStorage.removeItem("auth_token");
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
    const response = await axios.post("/api/auth/staff/check-login", {});
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
