import React from "react";
import { Facebook } from "lucide-react";

export default function Contact() {
  return (
    <footer className="bg-[#092851] text-white py-10 px-6 md:px-12 rounded-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Left Section */}
        <div className="flex flex-col gap-4 max-w-md w-full">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full">
              <img src="assets/icon.svg" alt="ExeQueue Logo" className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">ExeQueue</h1>
          </div>

          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            Queue Management System for Student Affairs Services Office
          </p>

          {/* Socials */}
          {/* <a
            href="#"
            className="w-8 h-8 flex items-center justify-center bg-white text-[#0a285f] rounded-full hover:bg-gray-200 transition"
          >
            <Facebook size={20} /> 
          </a> */}
          <p className="mt-6 text-sm">basta pisbuk logo ni nga part, wapa nahuman</p>
        </div>

        {/* Middle - Services */}
        <div className="grid grid-cols-2 gap-10">
          <div className="text-left w-full sm:w-auto">
                    <h2 className="text-blue-300 font-semibold mb-3">Service</h2>
                    <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                      <li>Good Moral</li>
                      <li>Insurance Payment</li>
                      <li>Transmittal Letter</li>
                      <li>Temporary Gate Pass</li>
                      <li>Uniform Exemption</li>
                      <li>Enrollment/Transfer</li>
                    </ul>
                  </div>

                  {/* Right - Product */}
                  <div className="text-left w-full sm:w-auto">
                    <h2 className="text-blue-300 font-semibold mb-3">Product</h2>
                    <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                      <li>Features</li>
                      <li>Tutorial</li>
                    </ul>
                  </div>
                </div>
        </div>
       

      {/* Bottom Note */}
      <div className="mt-10 text-center text-xs text-gray-400  lg:w-5xl">
        © 2025 University of Cebu Main Campus - ExeQueue v1.0.1 | All Rights Reserved.
      </div>
    </footer>
  );
}
