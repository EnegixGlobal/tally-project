import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  transparent?: boolean;
  centered?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ transparent = false, centered = false }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  return (
    <nav className={`${transparent ? 'bg-transparent' : 'bg-white'} shadow-sm border-b border-gray-200 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex ${centered ? 'justify-center' : 'justify-between'} items-center h-16`}>
          {!centered && (
            <div className="flex items-center">
              <Link to="/home" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-[#6D30D4]">ApnaBook</h1>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {isHomePage ? (
                    <>
                      <ScrollLink
                        to="features"
                        smooth={true}
                        duration={500}
                        className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium cursor-pointer transition duration-150"
                      >
                        Features
                      </ScrollLink>
                      <Link to="/pricing" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Pricing</Link>
                      <ScrollLink
                        to="testimonials"
                        smooth={true}
                        duration={500}
                        className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium cursor-pointer transition duration-150"
                      >
                        Testimonials
                      </ScrollLink>
                    </>
                  ) : (
                    <>
                      <Link to="/home#features" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Features</Link>
                      <Link to="/pricing" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Pricing</Link>
                      <Link to="/home#testimonials" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Testimonials</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {centered && (
            <div className="flex items-baseline space-x-8">
              <Link to="/home" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Home</Link>
              <Link to="/home#features" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Features</Link>
              <Link to="/pricing" className="text-[#6D30D4] px-3 py-2 text-sm font-medium">Pricing</Link>
              <Link to="/home#testimonials" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Testimonials</Link>
              <Link to="/contact" className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150">Contact</Link>
            </div>
          )}
          
          {!centered && (
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {`${user.firstName} ${user.lastName}`}</span>
                  <Link
                    to="/app"
                    className="text-[#6D30D4] hover:text-[#5a2bb5] px-3 py-2 text-sm font-medium transition duration-150"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-[#6D30D4] px-3 py-2 text-sm font-medium transition duration-150"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-[#6922DF] hover:bg-[#5a1cbf] text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
