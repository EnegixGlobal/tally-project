import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <p className="text-xl text-gray-600 mb-8">
            At TallyPrime, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, and protect your personal information.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-4">We collect information you provide directly to us, such as:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Account registration information (name, email, phone number)</li>
            <li>Business information and financial data you input into our software</li>
            <li>Payment information for subscription processing</li>
            <li>Communications with our support team</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Provide and maintain our accounting software services</li>
            <li>Process payments and manage your subscription</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Improve our services and develop new features</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
          <p className="text-gray-700 mb-6">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Bank-grade encryption for data transmission and storage</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication measures</li>
            <li>Regular data backups and disaster recovery procedures</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Retention</h2>
          <p className="text-gray-700 mb-6">
            We retain your personal information for as long as necessary to provide our services 
            and comply with legal requirements. You can request deletion of your account and 
            associated data at any time.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Access and update your personal information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability and export</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-6">
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us at:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@tallyprime.com<br />
              <strong>Phone:</strong> +91-80-1234-5678<br />
              <strong>Address:</strong> TallyPrime Technologies Pvt. Ltd.<br />
              123 Business Park, Bangalore, Karnataka 560001
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
