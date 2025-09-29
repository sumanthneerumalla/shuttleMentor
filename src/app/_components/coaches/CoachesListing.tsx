'use client';

import { useState } from 'react';
import { CoachCard } from './CoachCard';
import { api } from '~/trpc/react';

export function CoachesListing() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Placeholder for API call - will be implemented when the API endpoint is ready
  // const { data, isLoading, error } = api.coaches.getCoaches.useQuery({
  //   page,
  //   limit,
  // });

  // Placeholder data for development
  const placeholderCoaches = [
    {
      coachProfileId: '1',
      displayUsername: 'coach_john',
      firstName: 'John',
      lastName: 'Smith',
      bio: 'Experienced badminton coach with 10+ years of teaching players of all levels.',
      specialties: ['Singles', 'Footwork', 'Strategy'],
      rate: 50,
      isVerified: true,
      profileImageUrl: null,
    },
    {
      coachProfileId: '2',
      displayUsername: 'coach_sarah',
      firstName: 'Sarah',
      lastName: 'Johnson',
      bio: 'Former national champion specializing in doubles play and advanced techniques.',
      specialties: ['Doubles', 'Technique', 'Power Training'],
      rate: 65,
      isVerified: true,
      profileImageUrl: null,
    },
    {
      coachProfileId: '3',
      displayUsername: 'coach_mike',
      firstName: 'Mike',
      lastName: 'Chen',
      bio: 'Focused on helping beginners build a strong foundation in badminton basics.',
      specialties: ['Beginners', 'Fundamentals', 'Fitness'],
      rate: 40,
      isVerified: false,
      profileImageUrl: null,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Available Coaches</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select 
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            // onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rate_asc">Price: Low to High</option>
            <option value="rate_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Coaches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placeholderCoaches.map((coach) => (
          <CoachCard key={coach.coachProfileId} coach={coach} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-[var(--primary)] text-white rounded-md">
            {page}
          </span>
          <button 
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            // disabled={!data || page >= data.pagination.pageCount}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
