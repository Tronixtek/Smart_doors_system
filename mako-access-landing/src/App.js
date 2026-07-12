import React, { useState } from 'react';
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  CpuChipIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon,
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/api/v1';

const RegisterModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({ firstName: '', lastName: '', email: '', password: '' });
        }, 3000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
          >
            {success ? (
              <div className="text-center py-12">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Account Created!</h2>
                <p className="text-slate-600">You can now log in to the Mako Access mobile app to start managing your locks.</p>
              </div>
            ) : (
              <>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition">
                  <XMarkIcon className="h-6 w-6 text-slate-400" />
                </button>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
                  <p className="text-slate-600">Join thousands of users securing their spaces.</p>
                </div>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <UserIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="First Name" 
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <UserIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Last Name" 
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:bg-slate-300"
                  >
                    {loading ? 'Creating Account...' : 'Register Now'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Navbar = ({ onOpenRegister }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="fixed w-full z-50 glass py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">Mako Access</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="font-medium text-slate-600 hover:text-primary-600 transition">Features</a>
          <a href="#pricing" className="font-medium text-slate-600 hover:text-primary-600 transition">Pricing</a>
          <button 
            onClick={onOpenRegister}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-200"
          >
            Get Started
          </button>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t p-6 flex flex-col space-y-4 shadow-xl">
          <a href="#features" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Features</a>
          <a href="#pricing" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Pricing</a>
          <button 
            onClick={() => { onOpenRegister(); setIsOpen(false); }}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
    <div className="bg-primary-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
      <Icon className="h-8 w-8 text-primary-600" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const PricingCard = ({ plan, price, features, recommended = false, onOpenRegister }) => {
  const handlePayment = () => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: 'customer@example.com',
      amount: price * 100 * 450, // Price in Kobo (USD -> NGN at 450)
      currency: 'NGN',
      ref: ''+Math.floor((Math.random() * 1000000000) + 1),
      callback: (response) => {
        alert('Payment successful! Reference: ' + response.reference);
        onOpenRegister(); // Prompt to create account after payment
      },
      onClose: () => {
        alert('Transaction cancelled');
      }
    });
    handler.openIframe();
  };

  return (
    <div className={`p-8 rounded-[2.5rem] flex flex-col ${recommended ? 'bg-slate-900 text-white ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'bg-white text-slate-900 border border-slate-100 shadow-lg'}`}>
      <div className="mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${recommended ? 'text-primary-400' : 'text-primary-600'}`}>{plan}</span>
        <div className="flex items-baseline mt-2">
          <span className="text-4xl font-extrabold">$</span>
          <span className="text-6xl font-extrabold tracking-tight">{price}</span>
        </div>
      </div>
      
      <ul className="space-y-4 mb-10 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-center space-x-3">
            <CheckCircleIcon className={`h-6 w-6 ${recommended ? 'text-primary-400' : 'text-primary-600'}`} />
            <span className={recommended ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={handlePayment}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition ${recommended ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
      >
        Buy Now
      </button>
    </div>
  );
};

const App = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onOpenRegister={() => setIsRegisterOpen(true)} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
                Now Available Worldwide
              </span>
              <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8">
                Your Phone is Your <span className="text-primary-600">New Key</span>.
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
                The ultimate smart lock management platform for homes, offices, and hotels. Secure, seamless, and built for everyone.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary-200 hover:bg-primary-700 transition transform hover:-translate-y-1"
                >
                  Start Managing Now
                </button>
                <button className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition">
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-primary-200 blur-[100px] rounded-full opacity-20 -z-10"></div>
            <img
              src="/smart-lock.jpg"
              alt="Smart Lock"
              className="rounded-[3rem] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Built for Modern Security</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Everything you need to manage access across multiple locations without the headache of physical keys.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={DevicePhoneMobileIcon}
              title="Mobile First"
              description="Unlock doors directly from your mobile device using Bluetooth or eKeys."
            />
            <FeatureCard 
              icon={KeyIcon}
              title="Virtual Keys"
              description="Issue time-limited or recurring virtual keys to guests, employees, or contractors."
            />
            <FeatureCard 
              icon={CpuChipIcon}
              title="Mako Access Lock Ready"
              description="Seamless integration with Mako Access Lock hardware for enterprise-grade reliability."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600">Choose the plan that fits your organization's needs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <PricingCard
              plan="Starter"
              price={49 - 24}
              onOpenRegister={() => setIsRegisterOpen(true)}
              features={["Up to 5 Smart Locks", "10 Virtual Keys", "Basic Access Logs", "Mobile App Access"]}
            />
            <PricingCard
              plan="Professional"
              price={149 - 24}
              recommended={true}
              onOpenRegister={() => setIsRegisterOpen(true)}
              features={["Unlimited Smart Locks", "Unlimited Virtual Keys", "Advanced Analytics", "Multi-user Roles", "24/7 Support"]}
            />
            <PricingCard
              plan="Enterprise"
              price={499 - 24}
              onOpenRegister={() => setIsRegisterOpen(true)}
              features={["Custom Integration", "Dedicated Support", "API Access", "White-label Options", "On-site Installation"]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">Mako Access</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Mako Access. All rights reserved. Secured by Paystack.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
