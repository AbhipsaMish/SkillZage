// Header.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import logo from "../src/assets/skillzage-logo-final.svg";
import Navbar from './Navbar';
import "../src/App.css";

const Header = () => {
  const { isAuthenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header className="header">
      <nav className="header-nav">
        {/* Logo */}
        <div className="logo-container">
          <img 
            src={logo} 
            alt="Skillzage Logo" 
            className="logo"
            loading="lazy"
          />
        </div>

        {/* Centered Title & Subtitle */}
        <div className="title-container">
          <h1 className="site-title">Skillzage</h1>
          <div className="site-subtitle">
            <span className="subtitle1">SKILL TO BUILD</span>
            <span className="subtitle2">A BETTER FUTURE</span>
          </div>
        </div>

        {/* Profile Section - only shows when user is authenticated
        {isAuthenticated() && (
          <div className="user-profile-dropdown">
            <ProfileDropdown isMobile={isMobile} />
          </div>
        )} */}
      </nav>

      {/* Navigation Menu */}
      <Navbar isMobile={isMobile} />
    </header>
  );
};

export default Header;