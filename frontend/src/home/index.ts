// Home Pages
export { default as HomePage } from './pages/HomePage';
export { default as PricingPage } from './pages/PricingPage';
export { default as PurchasePage } from './pages/PurchasePage';

// Auth Pages
export { default as LoginPage } from './auth/LoginPage';
// SignupPage is imported directly in App.tsx to avoid case-sensitivity issues

// Components
export { default as Navigation } from './components/Navigation';
export { default as Features } from './components/Features';
export { default as PricingCard } from './components/PricingCard';
export { default as Testimonials } from './components/Testimonials';
export { default as Footer } from './components/Footer';

// Context
export { AuthProvider, useAuth } from './context/AuthContext';
