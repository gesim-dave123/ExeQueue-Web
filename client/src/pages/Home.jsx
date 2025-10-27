import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = (destination) => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate(destination);
    }, 2000);
  };

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
        <div className="flex justify-center">
          <p className="text-base sm:text-lg text-center mb-2 text-gray-700 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
            Your campus services, now more accessible than ever.
          </p>
        </div>

        {/* Buttons with improved styling and icons */}
        <div className="flex flex-col sm:flex-row mb-4 gap-5 justify-center ">
          {/* Proceed as Staff */}
          <Link to="/staff/login">
            <button
              className="border border-gray-400 hover:bg-[#1A73E8] w-full hover:text-white font-semibold py-5 px-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-md"
              // onClick={() => handleRedirect("/staff/login")}
            >
              <img
                src="/assets/User - V1.png"
                alt="search"
                className="w-6 h-6"
              />
              <span>Proceed as Staff</span>
            </button>
          </Link>

          {/* Request Service */}
          <Link to="/student/queue/request">
            <button className="bg-[#1A73E8] hover:bg-[#1557B0] w-full text-white font-semibold py-5 px-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-md">
              <img
                src="/assets/dashboard icons.png"
                alt="search"
                className="w-6 h-6"
              />
              <span className="">Request Service</span>
            </button>
          </Link>
        </div>

        <div className="items-center mb-8 text-center text-gray-500 text-sm sm:text-base">
          <p>
            Already have a queue number?{" "}
            <Link to="/student/queue/search">
              <span>
                <button
                  className="cursor-pointer underline text-[#1A73E8] hover:text-blue-700 transition-colors"
                  onClick={() => handleRedirect("/student/queue/search")} // change later to url destination for view queue
                >
                  Search Queue
                </button>
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
