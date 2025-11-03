import React from 'react'
import { Outlet } from 'react-router-dom'

export default function LayoutLogin() {
  return (
    <div className='min-h-screen '>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-10 left-30 w-96 h-96 bg-[#1A73E8] rounded-full mix-blend-multiply filter blur-3xl opacity-10  animate-blob"></div>
        <div className="absolute top-140 left-10 w-96 h-96 bg-[#1A73E8] rounded-full mix-blend-multiply filter blur-3xl opacity-10  animate-blob"></div>
        <div className="absolute top-170 left-1/4 w-60 h-60 bg-[#1A73E8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

        <div className="absolute top-1/8 right-135 w-60 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-90 -right-12 w-60 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div> 
        <div className="absolute top-160 right-90 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div> 
      </div>
      <div className='relative z-10'>
        <main>
          <Outlet/>
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
