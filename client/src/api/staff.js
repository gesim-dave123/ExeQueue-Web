import axios from 'axios';
import backendConnection from './backendConnection';

export const getWorkingScholars = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/staff/accounts/working-scholars`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching working scholars:', error);
    throw error;
  }
};

export const createWorkingScholar = async (accountData) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/staff/accounts/working-scholars`,
      accountData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating working scholar:', error);
    throw error;
  }
};

export const updateWorkingScholar = async (sasStaffId, accountData) => {
  try {
    const response = await axios.put(
      `${backendConnection()}/api/staff/accounts/working-scholars/${sasStaffId}`,
      accountData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating working scholar:', error);
    throw error;
  }
};

export const deleteWorkingScholar = async (sasStaffId) => {
  try {
    const response = await axios.delete(
      `${backendConnection()}/api/staff/accounts/working-scholars/${sasStaffId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting working scholar:', error);
    throw error;
  }
};
