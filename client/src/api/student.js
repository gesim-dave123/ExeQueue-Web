import axios from 'axios';
import backendConnection from './backendConnection.js';


// Api to submit Queue Details
export const submitQueueDetail = async (queueDetails) =>{
  
  try {
    if(!queueDetails) throw new Error("Queue Details is Empty!");

    const response = await axios.post(`${backendConnection()}/api/student/queue/generate`, queueDetails,
    {
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true
    });

    if(response.data.success && response.status === 201){
      console.log(response.data)
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
// Api to get Course Data
export const getCourseData = async () =>{
  try {
    const response = await axios.get(`${backendConnection()}/api/student/courses`, {},
    {
      headers:{
        "Content-Type": "application/json"
      },
      withCredentials:true
    } 
  );

  if(response.data.success && response.status){
    return {
      courseData: response.data.courseData
    }
  }

  } catch (error) {
    console.error("Error in Course Api (GET): ", error)
    showToast(error, "error")
  }

}
// Api to get Request Types
export const getRequestType = async ()=>{
  try {
    const response = await axios.get(`${backendConnection()}/api/student/requests`, {},
    {
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true
    }
  );

  if(response.data.success && response.status === 200){
    return{
      requestType: response.data.requestType
    }
  }

  } catch (error) {
    console.error("Error in fetchind request-type data: ",error)
    showToast(error, "error");
    
  }

}