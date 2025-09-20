import axios from 'axios';
import { showToast } from '../components/toast/ShowToast';
import backendConnection from './backendConnection.js';

export const login= async (formData) =>{
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/login`,
      formData,
      {
        headers:{
          "Content-Type": "application/json"
        },
        withCredentials: true
      }
    );
    if(response.status === 200){
      showToast(response.data.message, "success");

      return {
        role: response.data.role,
        success: response.data.success,
        token: response.data.token
      }
    }


  } catch (error) {
    if (error.response) {
      showToast(error.response.data.message || "Login failed", "error");
    } else if (error.request) {
      showToast("No response from server", "error");
    } else {
      showToast("An unexpected error occurred", "error");

    }
  }
}

export const logout = async() =>{
  try {
    const response = await axios.post(
      `${backendConnection()}/api/auth/logout`,
      {},
      {withCredentials: true}
    )
    if(response.status === 200){
      showToast(response.data.message, "success")
      return true
    }
  } catch (error) {
    console.error('Error in logout: ', error.response.data.message)
    showToast('An error occured when logging out!', "error") 
  }
}
