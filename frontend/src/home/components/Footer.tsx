import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">ApnaBook</h3>
            <p className="text-gray-400 leading-relaxed">
              Modern accounting software designed for Indian businesses. 
              Simplify your finances with our comprehensive solution.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/home#features" className="hover:text-white transition duration-150">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition duration-150">Pricing</Link></li>
              <li><Link to="/signup" className="hover:text-white transition duration-150">Free Trial</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition duration-150">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition duration-150">Documentation</a></li>
              <li><Link to="/contact" className="hover:text-white transition duration-150">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/about" className="hover:text-white transition duration-150">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition duration-150">Careers</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition duration-150">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 ApnaBook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
