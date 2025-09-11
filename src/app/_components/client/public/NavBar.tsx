'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { ChevronDown } from 'lucide-react';
import AnimatedLogo from '~/app/_components/shared/AnimatedLogo';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

export function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Automatically create user profile in database after sign-in
  const { isSignedIn, isLoaded } = useAuth();
  const { data: user } = api.user.getOrCreateProfile.useQuery(
    undefined,
    { 
      enabled: isLoaded && !!isSignedIn, // Only query when auth is loaded AND user is signed in
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      retry: false, // Don't retry if user is not authenticated
    }
  );

  // Add scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-white/50 backdrop-blur-sm"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <AnimatedLogo size="sm" />
            <span className="font-bold text-xl text-[var(--primary)]">
              ShuttleMentor
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
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
                className="nav-link flex items-center"
              >
                <span>How It Works</span>
                <ChevronDown className={cn(
                  "ml-1.5 h-4 w-4 transition-transform inline-flex",
                  (isDropdownOpen || isHovering) && "rotate-180"
                )} />
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
                    href="/#student-faq" 
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsHovering(false);
                    }}
                  >
                    For Students
                  </Link>
                  <Link 
                    href="/#coach-faq" 
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsHovering(false);
                    }}
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
          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="nav-button">
                <SignInButton />
              </div>
              <div className="nav-button">
                <SignUpButton />
              </div>
            </SignedOut>
            <SignedIn>
              <Link 
                href="/profile" 
                className="nav-link"
              >
                Profile
              </Link>
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