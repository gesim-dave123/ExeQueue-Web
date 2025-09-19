import axios from 'axios';
import backendConnection from './backendConnection.js';



export const studentsQueueDetails = async (queueDetails) =>{
  
  try {
    if(!queueDetails) throw new Error("Queue Details is Empty!");

    const response = await axios.post(`${backendConnection()}/api/queue/generate`, queueDetails,
    {
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true
    });

    if(response.data.success && response.status === 201){
      return{
        success: true,
        message: "Queue Generated",
        queueDetails: response.data.queueDetails
      }
    }
  } catch (error) {
    console.error("Error in Generating Queue: ", error)
    return{
      success: false,
      message: "Internal Server Error",
      queueDetails: null
    }
  }




}