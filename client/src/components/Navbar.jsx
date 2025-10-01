import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import icon from '/assets/icon.svg'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [targetLink, setTargetLink] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

    const isRequestPage = location.pathname === '/student/request';

    const closeMenu = () => {
      setIsMenuOpen(false);
    };

    const handleLinkClick = (link, event) => {
      event.preventDefault();
      
      // Check if user has selected a queue in Request page
      const hasQueueSelected = sessionStorage.getItem('hasRequestInProgress') === 'true';
      
      if (isRequestPage && hasQueueSelected) {
        setTargetLink(link);
        setShowConfirmation(true);
      } else {
        navigateToLink(link);
      }
      closeMenu();
    };

    const handleDesktopNavigation = (link) => {
      // Check if user has selected a queue in Request page
      const hasQueueSelected = sessionStorage.getItem('hasRequestInProgress') === 'true';
      
      // Only show confirmation if we're on Request page AND user selected a queue
      if (isRequestPage && hasQueueSelected) {
        setTargetLink(link);
        setShowConfirmation(true);
      } else {
        navigateToLink(link);
      }
    };

    const navigateToLink = (link) => {
      if (link === '/#' || link === '/') {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const hashIndex = link.indexOf('#');
        if (hashIndex !== -1) {
          const path = link.substring(0, hashIndex) || '/';
          const hash = link.substring(hashIndex + 1);
          
          navigate(path);
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 60);
        } else {
          navigate(link);
        }
      }
    };

    const confirmNavigation = () => {
      // Clear the session storage when user confirms navigation
      sessionStorage.removeItem('hasRequestInProgress');
      setShowConfirmation(false);
      if (targetLink) {
        navigateToLink(targetLink);
      }
    };

    const cancelNavigation = () => {
      setShowConfirmation(false);
      setTargetLink('');
    };

  return (
    <>
      <div className='flex justify-between min-h-[10vh] sticky top-0 backdrop-blur-md z-50'>
        <div className='flex items-center lg:ml-20 ml-0 '>
          <img src={icon} alt="Exequeue Logo" className='w-[10vh]' />
          <h1 className='text-2xl font-bold '>ExeQueue</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className='hidden lg:flex items-center mr-25 pr-10 gap-7 scroll-smooth'>
          <button 
            onClick={() => handleDesktopNavigation('/#')}
            className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'
          >
            Home
          </button>
          <button 
            onClick={() => handleDesktopNavigation('/#about')}
            className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'
          >
            About
          </button>
          <button 
            onClick={() => handleDesktopNavigation('/#help')}
            className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'
          >
            Help
          </button>
          <button 
            onClick={() => handleDesktopNavigation('/#faq')}
            className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-medium group relative'
          >
            FAQs
          </button>
        </div>

        <div className="lg:hidden flex items-center mr-10">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 min-h-10 text-gray-700 hover:text-blue-600 focus:outline-none cursor-pointer"
          >
            {isMenuOpen ? (
              <i className="in-h-10 fas fa-times text-xl"></i>
            ) : (
              <i className="fas fa-bars text-xl"></i>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='lg:hidden absolute top-14 sm:top-19 right-10 sm:right-9 w-35 border border-gray-200 flex text-start shadow-lg py-4 px-4 z-50 rounded-xl bg-white'>
            <div className='flex flex-col space-y-4'>
              <button 
                onClick={(e) => handleLinkClick('/#', e)} 
                className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-small text-left'
              >
                Home
              </button>
              <button 
                onClick={(e) => handleLinkClick('/#about', e)} 
                className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-small text-left'
              >
                About
              </button>
              <button 
                onClick={(e) => handleLinkClick('/#help', e)} 
                className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-small text-left'
              >
                Help
              </button>
              <button 
                onClick={(e) => handleLinkClick('/#faq', e)} 
                className='px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-colors font-small text-left'
              >
                FAQs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal - Only shows when queue is selected */}
      {showConfirmation && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Leave Request Page?
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to leave this page? Your progress will be lost.
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={cancelNavigation}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Stay on Page
                </button>
                <button
                  onClick={confirmNavigation}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Leave Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}