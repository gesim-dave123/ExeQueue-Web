import axios from "axios";
import { showToast } from "../components/toast/ShowToast.jsx";
import backendConnection from "./backendConnection.js";

export const getCourseData = async () =>{
  try {
    const response = await axios.get(`${backendConnection()}/api/course/courses`, {},
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