import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const CareersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Careers at TallyPrime</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Join our team and help us build the future of business accounting in India.
          </p>
          
          <div className="bg-gradient-to-r from-[#6D30D4] to-[#9D78DB] rounded-lg p-8 text-white mb-8">
            <h2 className="text-2xl font-bold mb-4">Why Work With Us?</h2>
            <ul className="space-y-2">
              <li>• Competitive salary and benefits</li>
              <li>• Flexible work arrangements</li>
              <li>• Learning and development opportunities</li>
              <li>• Collaborative and innovative environment</li>
              <li>• Make a real impact on Indian businesses</li>
            </ul>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
          
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Senior Full Stack Developer</h3>
              <p className="text-gray-600 mb-4">Remote • Full-time</p>
              <p className="text-gray-700 mb-4">
                We're looking for an experienced full-stack developer to help build and maintain 
                our cloud-based accounting platform.
              </p>
              <button className="bg-[#6922DF] text-white px-6 py-2 rounded-lg hover:bg-[#5a1cbf] transition duration-150">
                Apply Now
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Manager</h3>
              <p className="text-gray-600 mb-4">Bangalore • Full-time</p>
              <p className="text-gray-700 mb-4">
                Join our product team to help define the roadmap and user experience for 
                our accounting software.
              </p>
              <button className="bg-[#6922DF] text-white px-6 py-2 rounded-lg hover:bg-[#5a1cbf] transition duration-150">
                Apply Now
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Success Manager</h3>
              <p className="text-gray-600 mb-4">Mumbai • Full-time</p>
              <p className="text-gray-700 mb-4">
                Help our customers succeed with TallyPrime by providing excellent support 
                and guidance.
              </p>
              <button className="bg-[#6922DF] text-white px-6 py-2 rounded-lg hover:bg-[#5a1cbf] transition duration-150">
                Apply Now
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Don't see the right position?</h3>
            <p className="text-gray-700 mb-6">
              We're always looking for talented individuals. Send us your resume and we'll 
              keep you in mind for future opportunities.
            </p>
            <button className="bg-[#385192] text-white px-8 py-3 rounded-lg hover:bg-[#2d4179] transition duration-150">
              Send Resume
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CareersPage;
