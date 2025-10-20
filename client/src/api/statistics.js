import axios from 'axios';
import backendConnection from './backendConnection.js';

export const fetchDashboardStatistics = async () => {
  try {
    const response = await axios.get(
      `${backendConnection()}/api/statistics/dashboard`,
      {
        withCredentials: true,
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to fetch statistics.',
      };
    }
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return {
      success: false,
      message: 'Internal Server Error',
    };
  }
};
