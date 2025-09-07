import React from 'react'
import { Link } from 'react-router-dom'


export default function Navbar() {
  return (
    <div className=' flex justify-between min-h-[10vh] shadow-sm '>
      <div className='flex items-center ml-20'>
        <img src="public/assets/icon.svg" alt="" className='w-[10vh]' />
        <h1 className='text-2xl font-bold '>ExeQueue</h1>
      </div>
      <div className='flex items-center mr-25 pr-10 gap-7'>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Home</Link>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>About Us</Link>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>FAQs</Link>
        <Link className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'>Help</Link>
      </div>
   
    </div>
  )
}
