import React from 'react'

export default function Landing() {
  return (
   <div className="min-h-[90vh] flex justify-center items-center px-6 sm:px-12 md:px-24 font-sans bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
  {/* Animated background elements */}
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
    <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
    <div className="absolute top-1/4 -right-20 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>

  <div className="w-full max-w-5xl text-center md:text-left space-y-10 p-10 rounded-2xl  relative z-10 ">
     {/* Trust badge */}
    <div className=" flex flex-col items-center md:flex-row md:justify-between ">
      <span className="inline-block px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#F9AB00] to-[#1A73E8] text-white rounded-full shadow-md">
        💡 Fast • Secure • Reliable
      </span>
    </div>
    {/* Heading with improved gradient and animation */}
    <div className="space-y-3">
      <h1 className="text-4xl sm:  md:text-7xl lg:text-8xl font-extrabold text-gray-900 leading-tight">
        <span className="bg-gradient-to-r from-[#1A73E8] via-[#F9AB00] to-[#1A73E8] bg-clip-text text-transparent bg-size-200 animate-gradient">
          Student
        </span>{" "}
        Services, Simplified
      </h1>
      
      {/* Animated underline effect */}
      {/* <div className="w-24 h-1 bg-gradient-to-r from-[#1A73E8] to-[#F9AB00] rounded-full mx-auto md:mx-0"></div> */}
    </div>

    {/* Subtitle with improved styling */}
    <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
      Your campus services, now more accessible than ever.
    </p>

    {/* Stats section */}
    {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200">
      <div className="text-center">
        <div className="text-2xl font-bold text-[#1A73E8]">500+</div>
        <div className="text-sm text-gray-600">Services Monthly</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-[#F9AB00]">24/7</div>
        <div className="text-sm text-gray-600">Availability</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-[#1A73E8]">98%</div>
        <div className="text-sm text-gray-600">Satisfaction</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-[#F9AB00]">5min</div>
        <div className="text-sm text-gray-600">Avg. Response</div>
      </div>
    </div> */}

  {/* Feature highlights */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
      {[
        { icon: '🔒', title: 'Secure', desc: 'End-to-end encryption' },
        { icon: '⚡', title: 'Fast', desc: 'Quick response times' },
        { icon: '🎯', title: 'Reliable', desc: '99.9% uptime guarantee' }
      ].map((feature, index) => (
        <div key={index} className="flex flex-col items-center md:items-start p-4 bg-white/50 rounded-lg shadow-sm hover:bg-white transition-colors">
          <div className="text-2xl mb-2">{feature.icon}</div>
          <h3 className="font-semibold text-gray-800">{feature.title}</h3>
          <p className="text-sm text-gray-600 text-center md:text-left">{feature.desc}</p>
        </div>
      ))}
    </div>

      {/* Buttons with improved styling and icons */}
    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
      <button className="group bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer">
        <span>Request Service</span>
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
      </button>
      <button className="group border border-[#1A73E8] text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer">
        <span>Proceed as Staff</span>
      
      </button>
    </div>
    <div className='items-center text-center text-gray-500'>
      <p>Already have a queue number? <span><button className='cursor-pointer underline'>View Queue</button></span></p>
    </div>
   {/* Trust badge */}
    {/* <div className="pt-1 flex flex-col items-center md:flex-row md:justify-between gap-4">
      <span className="inline-block px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#F9AB00] to-[#1A73E8] text-white rounded-full shadow-md animate-pulse">
        💡 Fast • Secure • Reliable
      </span>
    </div> */}

  </div>

  <style jsx>{`
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient 3s ease infinite;
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