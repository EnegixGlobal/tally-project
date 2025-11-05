import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Shield, TrendingUp, Award, Heart } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const AboutUsPage: React.FC = () => {
  const features = [
    {
      icon: <CheckCircle className="w-6 h-6 text-[#6D30D4]" />,
      title: "GST Compliance",
      description: "Automated tax calculations and compliance with all Indian GST requirements"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[#6D30D4]" />,
      title: "Real-time Analytics",
      description: "Live financial reporting and business insights to drive growth"
    },
    {
      icon: <Users className="w-6 h-6 text-[#6D30D4]" />,
      title: "Multi-user Access",
      description: "Role-based permissions for seamless team collaboration"
    },
    {
      icon: <Shield className="w-6 h-6 text-[#6D30D4]" />,
      title: "Bank-grade Security",
      description: "Advanced encryption and security measures to protect your data"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Customer Support" },
    { number: "50+", label: "Integrations" }
  ];

  const team = [
    {
      name: "Rajesh Kumar",
      role: "CEO & Founder",
      description: "15+ years in fintech and business solutions"
    },
    {
      name: "Priya Sharma",
      role: "CTO",
      description: "Expert in cloud architecture and security"
    },
    {
      name: "Amit Patel",
      role: "Head of Product",
      description: "Specialized in accounting software and user experience"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#6D30D4] to-[#9D78DB] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About TallyPrime</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Empowering Indian businesses with modern, cloud-based accounting solutions. 
              We make financial management simple, secure, and compliant.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To simplify business accounting and help entrepreneurs focus on growing their business 
                rather than managing complex financial processes. We believe that every business, 
                regardless of size, deserves access to professional-grade accounting tools.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our commitment is to provide innovative, user-friendly solutions that adapt to the 
                evolving needs of Indian businesses while ensuring complete compliance with local regulations.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#6D30D4]/10 to-[#9D78DB]/10 rounded-2xl p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-[#6D30D4] rounded-2xl mb-6 mx-auto">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">Trusted by Businesses</h3>
              <p className="text-gray-600 text-center">
                From startups to established enterprises, thousands of businesses trust TallyPrime 
                for their accounting and financial management needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">Numbers that speak for themselves</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-[#6D30D4] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TallyPrime?</h2>
            <p className="text-xl text-gray-600">Everything you need to manage your business finances</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#6D30D4]/10 rounded-lg">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">
              Experienced professionals dedicated to your success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-[#6D30D4] to-[#9D78DB] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-[#6D30D4] font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#6D30D4] to-[#9D78DB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 mx-auto">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join thousands of businesses that have already simplified their accounting with TallyPrime. 
            Start your journey towards better financial management today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-[#6D30D4] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AboutUsPage;
