import React from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faUserCog } from "@fortawesome/free-solid-svg-icons";


export default function Landing() {
  return (
   <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden py-8">
  {/* Animated background elements */}
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
    <div className="absolute -top-12 -left-12 w-60 h-60 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
    <div className="absolute top-1/4 -right-12 w-60 h-60 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-12 left-1/3 w-60 h-60 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>

  <div className="w-full flex flex-col justify-center  max-w-4xl text-center md:text-left space-y-4 px-4 rounded-2xl relative z-10 min-h-[80vh] ">
    {/* Heading with improved gradient and animation */}
    <div className="space-y-6  text-center mb-10">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
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
      <button className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base">
        <FontAwesomeIcon icon={faClipboardList} size="lg" />
        <span>Request Service</span>
      </button>

      {/* Proceed as Staff */}
      <button className="border border-[#1A73E8] text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base">
        <FontAwesomeIcon icon={faUserCog} size="lg" />
        <span>Proceed as Staff</span>
      </button>
    </div>
    
    <div className='items-center mb-8 text-center text-gray-500 text-sm sm:text-base'>
      <p>Already have a queue number? <span><button className='cursor-pointer underline'>View Queue</button></span></p>
    </div>
    
    {/* Feature highlights */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-10 ">
      {[
        { icon: 'fa-sharp fa-solid fa-lock', title: 'Secure', desc: 'End-to-end encryption' },
        { icon: 'fa-sharp fa-solid fa-bolt', title: 'Fast', desc: 'Quick response times' },
        { icon: 'fa-sharp fa-solid fa-shield-alt', title: 'Reliable', desc: '99.9% uptime guarantee' }
      ].map((feature, index) => (
        <div key={index} className="flex flex-col items-center md:items-start p-3 bg-white/50 rounded-lg shadow-sm hover:bg-white transition-colors">
          <div className="text-xl mb-1">
            <i className={feature.icon}></i>
          </div>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{feature.title}</h3>
          <p className="text-xs text-gray-600 text-center md:text-left sm:text-sm">{feature.desc}</p>
        </div>
      ))}
    </div>
  </div>

  <style jsx>{`
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient 5s ease infinite;
    }
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `}</style>
</div>
  )
} 