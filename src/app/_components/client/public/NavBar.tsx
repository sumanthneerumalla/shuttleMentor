'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Add hover handler
  const handleHover = (hover: boolean) => {
    setIsDropdownOpen(hover);
  };

  // Track if we're hovering over the dropdown
  const [isHovering, setIsHovering] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">
              ShuttleMentor
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/coaches" 
              className="nav-link"
            >
              Find Coaches
            </Link>
            
            <div className="relative group">
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  // Toggle dropdown and reset hover state
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsHovering(false);
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="nav-link"
              >
                How It Works
              </button>
              <div 
                className="dropdown-container"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div 
                  className={
                    (isDropdownOpen || isHovering) 
                      ? "nav-dropdown opacity-100 visible" 
                      : "nav-dropdown opacity-0 invisible"
                  }
                >
                  <Link 
                    href="/for-students" 
                    className="dropdown-item"
                  >
                    For Students
                  </Link>
                  <Link 
                    href="/for-coaches" 
                    className="dropdown-item"
                  >
                    For Coaches
                  </Link>
                </div>
              </div>
            </div>
            
            <Link 
              href="/pricing" 
              className="nav-link"
            >
              Pricing
            </Link>
          </nav>

          {/* Authentication */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedOut>
              <div className="nav-button">
                <SignInButton />
              </div>
              <div className="nav-button">
                <SignUpButton />
              </div>
            </SignedOut>
            <SignedIn>
              <div className="nav-button">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;