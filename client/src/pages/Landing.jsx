import React from 'react'

export default function Landing() {
  return (
    <div className=' min-h-[90vh] ml-30 mr-30  p-10 flex justify-center items-center text-sans'>
       <div className='w-[60%]  text-left space-y-8 b'>
          <h1 className="text-6xl sm:text-5xl md:text-8xl font-bold text-gray-900 leading-tight self-start">
            <span className="bg-gradient-to-r from-[#1A73E8] to-[#F9AB00] bg-clip-text text-transparent">
              Student
            </span>{" "}
            Services, Simplified
          </h1>
          <p className='text-xl  text-gray-900 leading-relaxed'>
            Your campus services, now more accessible than ever.
          </p>
          <div className="mt-6 ">
            <button className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 mr-5 cursor-pointer">
              Begin Service Request
            </button>
            <button className="border border-[#1A73E8] text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 cursor-pointer">
              Manage Queue
            </button>
          </div>
      </div>
      <div className='w-[40%] flex justify-end items-center '>
        <img src="public/assets/logoLanding.svg" alt="" className="w-[83%] h-[88%]" />
            {/* {SVG HERE I NRIGHT SIDE}! */}
      </div>
    </div>
  )
} 