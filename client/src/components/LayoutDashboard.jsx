import React from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import Dashboard from '../pages/dashboard/Dashboard'
import Sidebar from './Sidebar'
export default function LayoutDashboard() {
  return (
    <div className='min-h-screen w-full  bg-gradient-to-br from-blue-50 via-white to-amber-50 '>
        {/* Animated background elements */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-12 -left-12 w-60 h-60 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/4 -right-12 w-60 h-60 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-12 left-1/3 w-60 h-60 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div> */}
   <div className="flex h-screen w-full bg-[#F5F5F5] overflow-hidden">
    {/* Sidebar (fixed, responsive, with inner padding) */}
    <div className="fixed inset-y-0 left-0 z-40 ">
      <div className="h-full p-[30px]">
        <Sidebar />
      </div>
    </div>

    {/* Main Content */}
    <main className="flex-1   overflow-y-auto ml-[50px] lg:ml-[270px] transition-all duration-300">
      <Outlet />
    </main>
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