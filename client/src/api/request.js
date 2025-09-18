import axios from 'axios';
import { showToast } from '../components/toast/ShowToast.jsx';
import backendConnection from './backendConnection.js';


export const getRequestType = async ()=>{
  try {
    const response = await axios.get(`${backendConnection()}/api/request/request-type`, {},
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
