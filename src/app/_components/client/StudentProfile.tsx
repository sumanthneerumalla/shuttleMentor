'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { ProfileImageUploader } from '../shared/ProfileImageUploader';
import { ProfileImageDisplay } from '../shared/ProfileImageDisplay';
import { ProfileAvatar } from '../shared/ProfileAvatar';

// Character limits
const BIO_CHAR_LIMIT = 500;
const GOALS_CHAR_LIMIT = 500;

interface StudentProfileProps {
  initialProfile: {
    studentProfileId: string;
    skillLevel: string | null;
    goals: string | null;
    bio: string | null;
    profileImageUrl?: string | null;
  } | null;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  clubName?: string | null;
}

export default function StudentProfile({ initialProfile, firstName, lastName, clubName }: StudentProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    skillLevel: initialProfile?.skillLevel || '',
    goals: initialProfile?.goals || '',
    bio: initialProfile?.bio || '',
    profileImage: '', // Base64 encoded image data
  });

  const utils = api.useUtils();
  const updateProfile = api.user.updateStudentProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.user.getOrCreateProfile.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      skillLevel: initialProfile?.skillLevel || '',
      goals: initialProfile?.goals || '',
      bio: initialProfile?.bio || '',
      profileImage: '',
    });
  };
  
  const handleImageChange = (imageData: string | null) => {
    setFormData({
      ...formData,
      // When null is passed, use empty string to explicitly signal image deletion
      profileImage: imageData === null ? '' : imageData,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            Edit Student Profile
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Skill Level</label>
            <p className="text-lg">{formData.skillLevel || "Not set"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Club</label>
            <p className="text-lg">{clubName || "Not set"}</p>
          </div>

          <ProfileImageDisplay 
            imageUrl={initialProfile?.profileImageUrl} 
            name={firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : null}
            alt="Student Profile"
          />

          <div>
            <label className="text-sm text-gray-500">Learning Goals</label>
            <p className="text-lg whitespace-pre-wrap">{formData.goals || "Not set"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Bio</label>
            <p className="text-lg whitespace-pre-wrap">{formData.bio || "Not set"}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image
            </label>
            <ProfileImageUploader
              initialImageUrl={initialProfile?.profileImageUrl}
              onChange={handleImageChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Level
            </label>
            <select
              value={formData.skillLevel}
              onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select skill level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </div>

          {/* Learning Goals with character counter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Learning Goals
              </label>
              <span className={`text-xs ${formData.goals.length > GOALS_CHAR_LIMIT ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.goals.length}/{GOALS_CHAR_LIMIT}
              </span>
            </div>
            <textarea
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              className={`w-full px-3 py-2 border ${formData.goals.length > GOALS_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-h-[100px] resize-y`}
              placeholder="What are your badminton goals?"
              maxLength={GOALS_CHAR_LIMIT}
            />
          </div>

          {/* Bio with character counter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <span className={`text-xs ${formData.bio.length > BIO_CHAR_LIMIT ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.bio.length}/{BIO_CHAR_LIMIT}
              </span>
            </div>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`w-full px-3 py-2 border ${formData.bio.length > BIO_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-h-[100px] resize-y`}
              placeholder="Tell us about yourself"
              maxLength={BIO_CHAR_LIMIT}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
