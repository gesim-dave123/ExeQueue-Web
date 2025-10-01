import React from 'react'
import { faClipboardList, faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Request from "./students/Request";
import { Link } from 'react-router-dom'
export default function Home() {

    const handleRedirect = (destination) =>{
    setLoading(true);

    // simulate a loading process, then navigate
    setTimeout(() => {
      setLoading(false);
      navigate(destination);
    }, 2000); 
    if(destination === '/student'){
      window.location.href = "/"; // or use your router
    }
    else if(destination === '/staff/login'){
      window.location.href = destination; // or use your router
    }
    else if(destination === '/student/view-queue'){
      console.log('View Queue')
      window.location.href = destination
    }
  }

  return (
    <div>
      <div className="w-full flex flex-col justify-center  max-w-4xl text-center md:text-left space-y-4 px-4 rounded-2xl relative z-10 min-h-[80vh] ">
        {/* Heading with improved gradient and animation */}
        <div className="space-y-6 pt-10  sm:pt-0 text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-[#1A73E8] via-[#F9AB00] to-[#1A73E8] bg-clip-text text-transparent bg-size-200 animate-gradient">
              Student
            </span>{" "}
            Services, Simplified
          </h1>
        </div>

        {/* Subtitle with improved styling */}
        <div className='flex justify-center'>
          <p className="text-base sm:text-lg text-center mb-6 text-gray-700 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
            Your campus services, now more accessible than ever.
          </p>
          
        </div>
      
        {/* Buttons with improved styling and icons */}
        <div className="flex flex-col sm:flex-row mb-4 gap-3 justify-center ">
            {/* Request Service */}
          <Link to="/student/request">
            <button className="bg-[#1A73E8] hover:bg-[#1557B0] w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-md"
            >
            <span className="">Request Service</span>
            </button>
          </Link>

          {/* Proceed as Staff */}
          <Link to="/student/live-queue">
          <button className="border border-[#1A73E8] text-[#1A73E8] hover:bg-[#1A73E8] w-full hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-md"
            onClick={() =>handleRedirect('/staff/login')}
          >
            <span>Proceed as Staff</span>
          </button>
          </Link>
        </div>
        
        <div className='items-center mb-8 text-center text-gray-500 text-sm sm:text-base'>
          <p>Already have a queue number? <span><button className='cursor-pointer underline '
            onClick={() => handleRedirect('/student')} // change later to url destination for view queue
          >
          Search Queue</button></span></p>
        </div>

      </div>
    </div>
  )
}
