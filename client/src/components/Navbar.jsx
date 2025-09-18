import React, { useState } from 'react';
import { Link } from 'react-router-dom'


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className='flex justify-between min-h-[10vh] shadow-sm '>
      <div className='flex items-center lg:ml-20 ml-0 '>
        <img src="public/assets/icon.svg" alt="" className='w-[10vh]' />
        <h1 className='text-2xl font-bold '>ExeQueue</h1>
      </div>
      <div className='hidden lg:flex items-center mr-25 pr-10 gap-7'>
        <Link to= "/" className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Home</Link>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>About Us</Link>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>FAQs</Link>
        <Link to="/help" className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Help</Link>
      </div>

        <div className="lg:hidden flex items-center mr-10">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 min-h-10 text-gray-700 hover:text-blue-600 focus:outline-none  cursor-pointer">
                  {isMenuOpen ? (
                    <i className="in-h-10 fas fa-times text-xl"></i>
                  ) : (
                    <i className="fas fa-bars text-xl"></i>
                  )}
            </button>
        </div>
        

       
        {isMenuOpen && (
            <div className='lg:hidden absolute top-[10vh] left-0 right-0 shadow-lg py-4 px-6 z-50  bg-gradient-to-br from-blue-50 via-white to-amber-50'>
                <div className='flex flex-col space-y-4'>
                   <Link to= "/" className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Home</Link>
                    <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>About Us</Link>
                    <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>FAQs</Link>
                    <Link  to="/help"  className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Help</Link>
                </div>
            </div>
        )}
    </div>
  )
}
