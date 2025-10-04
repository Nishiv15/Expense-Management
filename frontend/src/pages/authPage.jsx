import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 1. Import Link from react-router-dom
import { Link, useNavigate } from 'react-router-dom';
import login from '../assets/login.jpg';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    rePassword: '',
    country: '',
    currency: '',
  });
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLogin) {
      const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
          const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
          const sortedCountries = response.data.sort((a, b) => a.name.common.localeCompare(b.name.common));
          setCountries(sortedCountries);
        } catch (err) {
          console.error("Failed to fetch countries", err);
          setError("Could not load country list.");
        }
        setLoadingCountries(false);
      };
      fetchCountries();
    }
  }, [isLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'country') {
      const selectedCountry = countries.find(c => c.name.common === value);
      if (selectedCountry && selectedCountry.currencies) {
        const currencyCode = Object.keys(selectedCountry.currencies)[0];
        setFormData(prevData => ({ ...prevData, currency: currencyCode }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      try {
        const { email, password } = formData;
        const response = await axios.post('http://localhost:5001/api/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred during login.');
      }
    } else {
      if (formData.password !== formData.rePassword) {
        return setError("Passwords do not match.");
      }
      if (!formData.currency) {
        return setError("Please select a country to set the currency.");
      }
      
      try {
        const payload = {
          companyName: formData.companyName,
          email: formData.email,
          password: formData.password,
          currency: formData.currency,
          fullName: formData.companyName
        };
        
        const response = await axios.post('http://localhost:5001/api/auth/signup', payload);
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred during signup.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Left Section: Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:min-h-screen">
        <div className="max-w-md w-full">
          <div className="flex items-center mb-6">
            <span className="text-4xl font-bold text-gray-800">ExpenseManager</span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{isLogin ? 'Login' : 'Sign Up'}</h2>
          <p className="text-gray-600 mb-8">
            See your growth and get consulting support!
          </p>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input 
                    type="text" 
                    id="companyName" 
                    name="companyName" 
                    onChange={handleInputChange} 
                    value={formData.companyName}
                    required 
                    className="mt-1 block w-full px-3 py-2 border rounded-md" 
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    id="country"
                    name="country"
                    onChange={handleInputChange}
                    value={formData.country}
                    required
                    disabled={loadingCountries}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-black rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>{loadingCountries ? 'Loading...' : 'Select your country'}</option>
                    {countries.map(country => (
                      <option key={country.name.common} value={country.name.common}>
                        {country.name.common}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                onChange={handleInputChange} 
                value={formData.email}
                required 
                className="mt-1 block w-full px-3 py-2 border rounded-md" 
              />
            </div>

            <div className="mb-4"> 
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                onChange={handleInputChange} 
                value={formData.password}
                required 
                className="mt-1 block w-full px-3 py-2 border rounded-md" 
              />
            </div>

            {!isLogin && (
              <div className="mb-6">
                <label htmlFor="rePassword" className="block text-sm font-medium text-gray-700">Re-enter Password</label>
                <input 
                  type="password" 
                  id="rePassword" 
                  name="rePassword" 
                  onChange={handleInputChange} 
                  value={formData.rePassword}
                  required 
                  className="mt-1 block w-full px-3 py-2 border rounded-md" 
                />
              </div>
            )}
            
            {/* 2. ADDED "FORGOT PASSWORD?" LINK SECTION */}
            {isLogin && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox" 
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button 
              type="submit" 
              className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Not registered yet?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
            >
              {isLogin ? 'Create an Account' : 'Login'}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-gray-500">
            ©2025 ExpenseManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Section: Image */}
      <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-8 bg-indigo-700 relative">
        <img 
          src={login} 
          alt="Decorative" 
          className="max-w-full max-h-full object-contain" 
        />
        <div className="absolute inset-0 bg-indigo-800 opacity-20"></div>
      </div>
    </div>
  );
};

export default AuthPage;