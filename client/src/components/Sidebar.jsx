import React, { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, LayoutDashboard, List, CreditCard, BarChart3, Menu, X } from "lucide-react";
import icon from '/assets/icon.svg'
import { Link, NavLink } from "react-router-dom";
import Display_Queue from "../pages/dashboard/Display_Queue";
import ManageAccount from "../pages/dashboard/ManageAccount";

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [subItem, setSubItem] = useState('');

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      <div
        className={`bg-white px-1 rounded-3xl  h-full shadow-xs transition-all duration-300 ease-in-out flex flex-col fixed lg:relative z-50 ${
          isSidebarOpen ? "w-64" : "md:w-64 w-16 lg:w-70"
        }`}
      >
        {/* Top Section - Logo */}
        <div className="flex items-center justify-between  pt-3  mb-10 ">
          <div className="flex items-center ">
              <div className="flex items-center justify-center">
                      <img src={icon} alt="Exequeue Logo" className="w-[9vh]" />
                      <h1 className="text-xl font-bold -ml-3  ">ExeQueue</h1>
                    </div>
            {/* Show text only when sidebar is open */}
            <h1 className={`text-lg font-semibold ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
              
            </h1>
          </div>

          {/* Hamburger button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden w-8 h-8 text-gray-600 hover:text-gray-900"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Split icon for desktop */}
          <button className="hidden md:block text-gray-400 hover:text-gray-600 pr-8 cursor-pointer">
            {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" />
              <rect x="14" y="3" width="7" height="18" />
            </svg> */}
            <img src="/assets/dashboard/minimize.png" alt="" />
          </button>
        </div>

        {/* Nav Items */}
        <div className={` flex-1 overflow-y-auto py-4 ${isSidebarOpen ? 'px-3' : 'px-3 md:px-3'}`}>
          {/* Dashboard */}
          <Link to ="/dashboard"
            href="#" 
            onClick={() => {
              setActiveItem('dashboard');
              setSubItem('');
              setIsQueueOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-1 ${
              activeItem === 'dashboard' 
                ? 'bg-[#DDEAFC] text-[#1A73E8] font-medium' 
                : 'text-black hover:bg-gray-50'
            } ${isSidebarOpen ? '' : 'justify-center md:justify-start'}`}
          >
            <div>
                  <img   src="/assets/dashboard/dashboard bnw.png" 
                alt="" 
                className={`w-full h-full transition-all ${
                  activeItem === 'dashboard' 
                    ? 'brightness-0 saturate-100 hue-rotate-[220deg]' 
                    : ''
                }`}
                  style={activeItem === 'dashboard' ? {
                  filter: 'invert(39%) sepia(57%) saturate(2878%) hue-rotate(202deg) brightness(97%) contrast(97%)'
                } : {}}
                 />
            </div>
            <span className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`}>Dashboard</span>
          </Link>

          {/* Queue with submenu */}
          <div className="mb-1 flex flex-col justify-start items-start">
            <button 
              onClick={() => {
                setIsQueueOpen(!isQueueOpen);
                setActiveItem('queue');
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition cursor-pointer ${
                activeItem === 'queue' 
                  ? 'bg-[#DDEAFC] text-[#1A73E8] font-medium'  
                  : 'text-black hover:bg-gray-50'
              } ${isSidebarOpen ? '' : 'justify-center md:justify-between'}`}
            >
              <div className="flex items-center gap-3">
                <img   src="/assets/dashboard/queue.png" 
                alt="" 
                className={`w-full h-full transition-all ${
                  activeItem === 'queue' 
                    ? 'brightness-0 saturate-100 hue-rotate-[220deg]' 
                    : ''
                }`}
                  style={activeItem === 'queue' ? {
                  filter: 'invert(39%) sepia(57%) saturate(2878%) hue-rotate(202deg) brightness(97%) contrast(97%)'
                } : {}}
                 />
                <span className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`}>Queue</span>
              </div>
              {isQueueOpen ? 
                <ChevronUp size={16} className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`} /> : 
                <ChevronDown size={16} className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`} />
              }
            </button>
            
            {/* Submenu */}
            {isQueueOpen && (
              <div className={`ml-4  text-left items-center justify-center mt-1 space-y-1 border-l-2 border-gray-200 pl-4 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
                <a 
                  href="#" 
                  onClick={() =>{ 
                    setSubItem('manage-queue'); 
                  }}
                  className={`block px-3 py-2  text-sm transition ${
                    subItem === 'manage-queue' 
                      ? 'text-[#1A73E8] font-medium' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  
                  Manage Queue
                </a>
                <Link to ="/dashboard/display-queue" 
                  href="#" 
                  onClick={() => setSubItem('display-queue')}
                  className={`block px-3 py-2 text-sm transition ${
                    subItem === 'display-queue' 
                      ? 'text-[#1A73E8] font-medium' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Display Queue
                </Link>
              </div>
            )}
          </div>

          {/* Manage Accounts */}
          <Link to ="/dashboard/manage-account" 
            href="#" 
            onClick={() => {
              setActiveItem('accounts');
              setSubItem('');
              setIsQueueOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-1 ${
              activeItem === 'accounts' 
                ? 'bg-[#DDEAFC] text-[#1A73E8] font-medium' 
                : 'text-black hover:bg-gray-50'
            } ${isSidebarOpen ? '' : 'justify-center md:justify-start'}`}
          >
            <div className="inline-block w-5 h-5 flex-shrink-0">
              <img 
                src="/assets/dashboard/manage.png" 
                alt="" 
                className={`w-full h-full transition-all ${
                  activeItem === 'accounts' 
                    ? 'brightness-0 saturate-100 hue-rotate-[220deg]' 
                    : ''
                }`}
                style={activeItem === 'accounts' ? {
                  filter: 'invert(39%) sepia(57%) saturate(2878%) hue-rotate(202deg) brightness(97%) contrast(97%)'
                } : {}}
              />
            </div>
            <span className={`pl-1 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}> Manage Accounts</span>
          </Link>

          {/* Transactions */}
          <a 
            href="#" 
            onClick={() => {
              setActiveItem('transactions');
              setSubItem('');
              setIsQueueOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-1 ${
              activeItem === 'transactions' 
                ? 'bg-[#DDEAFC] text-[#1A73E8] font-medium' 
                : 'text-black hover:bg-gray-50'
            } ${isSidebarOpen ? '' : 'justify-center md:justify-start'}`}
          >
            <div>
                  <img   src="/assets/dashboard/transactions.png" 
                alt="" 
                className={`w-full h-full transition-all ${
                  activeItem === 'transactions' 
                    ? 'brightness-0 saturate-100 hue-rotate-[220deg]' 
                    : ''
                }`}
                  style={activeItem === 'transactions' ? {
                  filter: 'invert(39%) sepia(57%) saturate(2878%) hue-rotate(202deg) brightness(97%) contrast(97%)'
                } : {}}
                 />
            </div>
            <span className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`}>Transactions</span>
          </a>

          {/* Analytics */}
          <a 
            href="#" 
            onClick={() => {
              setActiveItem('analytics');
              setSubItem('');
              setIsQueueOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-1 ${
              activeItem === 'analytics' 
                ? 'bg-[#DDEAFC] text-[#1A73E8] font-medium' 
                : 'text-black hover:bg-gray-50'
            } ${isSidebarOpen ? '' : 'justify-center md:justify-start'}`}
          >
            <div>
                  <img   src="/assets/dashboard/analytics.png" 
                alt="" 
                className={`w-full h-full transition-all ${
                  activeItem === 'analytics ' 
                    ? 'brightness-0 saturate-100 hue-rotate-[220deg]' 
                    : ''
                }`}
                  style={activeItem === 'analytics' ? {
                  filter: 'invert(39%) sepia(57%) saturate(2878%) hue-rotate(202deg) brightness(97%) contrast(97%)'
                } : {}}
                 />
            </div>
            <span className={`${isSidebarOpen ? 'block' : 'hidden md:block'}`}>Analytics</span>
          </a>
        </div>

        {/* Bottom User Section */}
        <div className={` p-4 ${isSidebarOpen ? '' : 'hidden md:block'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  rounded-full flex items-center justify-center flex-shrink-0">
              <img src="/assets/dashboard/personnel.png" alt="" />
            </div>
            <div className={`flex-1 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
              <div className="text-sm text-left font-medium text-gray-900">Lance Timothy Satorre</div>
              <div className="text-xs text-left text-gray-500">Personnel</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}