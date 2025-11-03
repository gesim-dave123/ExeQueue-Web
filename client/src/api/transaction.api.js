import axios from "axios";
import backendConnection from "./backendConnection.js";

export const getTransactionHistory = async (params) => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/transaction/transactions?${params.toString()}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    if (response.status === 200 && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Error in fetching transaction history: ", error);
    return null;
  }
};

export const getTransactionStats = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/transaction/stats`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    if (response.status === 200 && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Error in fetching transaction history: ", error);
    return null;
  }
};
