import React from 'react'

export default function Landing() {
  return (
    <div className=' min-h-[90vh] mt-20 p-10'>
      <div className='w-[50%]  '>
          <h1 className="text-6xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-[#1A73E8] to-[#F9AB00] bg-clip-text text-transparent">
              Student
            </span>{" "}
            Services, Simplified
          </h1>
            <p className='text-xl font-light text-gray-700 leading-relaxed'>
            Your campus services, now more accessible than ever.
            </p>
            <div>
              <button>Begin Service Request</button>
              <button>Manage Queue</button>
            </div>
      </div>
      <div className='w-[50%] bg-amber-900'>
            <h2>sfd</h2>
      </div>
    </div>
  )
} 