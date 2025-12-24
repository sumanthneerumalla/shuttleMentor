'use client';

import { CheckCircle, Calendar, MessageCircle } from 'lucide-react';
import { ProfileAvatar } from '../shared/ProfileAvatar';
import Link from 'next/link';

interface CoachDetailProps {
  coach: {
    coachProfileId: string;
    displayUsername: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    experience: string | null;
    specialties: string[];
    teachingStyles: string[];
    rate: number;
    isVerified: boolean;
    headerImage: string | null;
    profileImageUrl: string | null;
    createdAt: string;
    clubName: string;
  };
}

export function CoachDetail({ coach }: CoachDetailProps) {
  const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim();
  const joinDate = new Date(coach.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
  
  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex-shrink-0">
            <ProfileAvatar 
              imageUrl={coach.profileImageUrl}
              name={fullName}
              alt={`${fullName}'s profile`}
              size="xl"
            />
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              {coach.isVerified && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </div>
              )}
            </div>
            
            <p className="text-gray-600 font-medium mb-2">{coach.clubName}</p>
            
            <p className="text-gray-600 mb-4">{coach.bio}</p>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {coach.specialties.map((specialty) => (
                <span 
                  key={specialty} 
                  className="px-3 py-1 bg-white border border-[var(--primary)] text-[var(--primary)] text-sm rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
            
            <p className="text-gray-500 text-sm">
              Coach since {joinDate}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Hourly Rate</p>
              <p className="text-2xl font-bold text-[var(--primary)]">${coach.rate}</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Book a Session
              </button>
              
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2">
          {/* Experience */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Experience</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{coach.experience}</p>
          </div>
          
          {/* Teaching Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Teaching Style</h2>
            <div className="flex flex-wrap gap-2">
              {coach.teachingStyles.map((style) => (
                <span 
                  key={style} 
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
          
          {/* Reviews - Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <p className="text-gray-500 italic">No reviews yet.</p>
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          {/* Booking Widget - Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Book a Session</h2>
            <p className="text-gray-500 text-sm mb-4">
              Select a date and time to book a session with {fullName}.
            </p>
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Booking calendar coming soon</p>
            </div>
          </div>
          
          {/* Contact Info - Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contact</h2>
            <p className="text-gray-500 text-sm">
              Contact {fullName} directly through ShuttleMentor messaging.
            </p>
            <Link 
              href="#" 
              className="mt-4 block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Send Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
