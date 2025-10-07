import React from 'react'
import { Shield, Zap, CheckCircle2, Folder, BadgeCheck } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="w-full min-h-screen sm:gap-10 flex flex-col lg:flex-row justify-center items-center mt-20 sm:mt-7 py-16 px-10 sm:px-8">
     {/* Left side */}
      <div className="w-full lg:w-1/2 flex justify-center  ml-7 mr-7 relative mb-12 lg:mb-0">
        <div className="absolute -top-13  w-70 h-40 sm:w-100 sm:h-70 bg-[#F9AB00]/25 rounded-full  filter blur-xl opacity-20"></div>

        {/* Container with scaling */}
        <div className="relative flex justify-center w-[380px] sm:w-[450px] md:w-[470px] lg:w-[500px] 
                        transform origin-center scale-90 sm:scale-90 md:scale-100">
          {/* Main ticket */}
          <div className="bg-white w-1/2 shadow-sm border border-[#E2E3E4] rounded-xl 
                          px-8 sm:px-12 py-12 sm:py-16 text-center 
                          text-4xl sm:text-4xl md:text-5xl font-bold text-blue-600">
            P01
          </div>

          {/* Floating tags */}
          <div className="absolute font-semibold top-12 -left-4 sm:top-17 sm:-left-7 md:top-17 md:-left-11 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" />
             Enrollment/Transfer
          </div>

          <div className="absolute font-semibold top-22 -left-1 sm:top-27 sm:-left-1 md:top-28 md:-left-3 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" />Temporary Gate Pass
          </div>

          <div className="absolute font-semibold top-32 left-14 sm:top-37 sm:left-17 md:top-39 md:left-18 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" /> Uniform Exemption
          </div>

          <div className="absolute font-semibold -top-7 right-19 sm:-top-7 sm:right-23 md:-top-7 md:right-24 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" />Good Moral
          </div>

          <div className="absolute font-semibold top-3 -right-3 sm:top-3 sm:-right-2 md:top-4 md:-right-6 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" />Insurance Payment
          </div>

          <div className="absolute font-semibold top-13 right-2 sm:top-13 sm:right-3 md:top-15 md:-right-0 bg-white shadow-xs rounded-xl 
                          border border-[#E2E3E4] px-3 py-2 text-[10px] sm:text-xs md:text-sm 
                          flex items-center gap-2">
            <img src="assets/check.svg" alt="" /> Transmittal Letter
          </div>
        </div>
      </div>


      {/* Right side */}
      <div className="w-full  pl-20 lg:w-1/2 lg:pl-8 xl:pl-12 text-left mr-15">
        <h1 className="text-3xl sm:text-4xl font-medium  leading-tight">Built to Streamline</h1>
        <h1 className="text-3xl sm:text-4xl font-medium leading-tight mt-2">Your Campus Exercise</h1>
        <p className="mt-4 text-gray-600 text-base sm:text-lg">
          Join thousands of students and staff who use ExeQueue to save time and reduce wait times.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 sm:mt-18">
          <div className="gap-4">
            <div className="inline-block bg-[#DDEAFC]/55 p-2 rounded-xl mb-2">
              <Shield className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-1" />
            </div>
            <div>
                <h2 className="font-semibold text-lg sm:text-lg mb-1">Secure</h2>
                <p className="text-gray-600 text-md sm:text-md">Your information stays safe at all times.</p>
            </div>
          </div>
          <div className="gap-10">
            <div className='inline-block bg-[#DDEAFC]/55 p-2 rounded-xl mb-2'>
            <Zap className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-1" />
            </div>   
            <div className='gap-10'>
              <h2 className="font-semibold text-lg sm:text-lg mb-1">Fast</h2>
              <p className="text-gray-600 text-md">Get in line and get real-time updates in seconds.</p>
            </div>
          </div>
          <div className="gap-3">
            <div className='inline-block bg-[#DDEAFC]/55 p-2 rounded-xl mb-2'>
            <BadgeCheck className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-1" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg mb-1">Reliable</h2>
              <p className="text-gray-600 text-md sm:text-md">Always available when you need it.</p>
            </div>
          </div>
          <div className="gap-3">
            <div className='inline-block bg-[#DDEAFC]/55 p-2 rounded-xl mb-2'>
            <Folder className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-1" />
            </div>
            <div className=''>
              <h2 className="font-semibold text-base sm:text-lg mb-1">Organized</h2>
              <p className="text-gray-600 text-md sm:text-md">A structured and orderly digital queue for everyone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}