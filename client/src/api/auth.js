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

    if (response.status === 200) {
      showToast(response.data.message, "success");
      return {
        success: response.data.success,
        token: response.data.token,
        role: response.data.role,
      };
    }
  } catch (error) {
    if (error.response) {
      showToast(error.response.data.message || "Login failed", "error");
    } else if (error.request) {
      showToast("No response from server", "error");
    } else {
      showToast("An unexpected error occurred", "error");
    }
    return null;
  }
};

export const sendOTPtoEmail = async (email) => {
  try{
     const response = await axios.post(
      `${backendConnection()}/api/auth/getOTP`,
      {email},
      { 
        headers: {"Content-Type" : "application/json"},
        withCredentials: true }
    );

    if(response.status === 200){
      showToast(response.data.message, "success");
      return true;
    }
  }catch (error){
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

export const verifyOTP = async (otp,email) => {
  try{
    const response = await axios.post(
      `${backendConnection()}/api/auth/verify-email`,
      {     
        receivedOTP: otp,
        email: email,          
      },
      { 
        headers: {"Content-Type" : "application/json"},
        withCredentials: true 
      }
    );

    if(response.status === 200){
      showToast(response.data.message, "success");
      return true;
    };

  }catch(error){
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

export const resetPassword = async (newPass, confirmPass, email) => {
  try{
    const response = await axios.post(
      `${backendConnection()}/api/auth/reset-password`,
      {     
        newPassword: newPass,
        confirmPassword: confirmPass,
        email: email,          
      },
      { 
        headers: {"Content-Type" : "application/json"},
        withCredentials: true 
      }
    );

    if(response.status === 200){
      showToast(response.data.message, "success");
      return true;
    }
  }catch (error){
    if (error.response) {
      showToast(error.response.data.message || "Passwords doesn't match", "error");
    } else if (error.request) {
      showToast("No response from server", "error");
    } else {
      showToast("An unexpected error occurred", "error");
    }
    return false;
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
      showToast(response.data.message, "success");
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
