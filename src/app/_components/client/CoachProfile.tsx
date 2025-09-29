'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { ProfileImageUploader } from '../shared/ProfileImageUploader';
import { ProfileImageDisplay } from '../shared/ProfileImageDisplay';
import { ProfileAvatar } from '../shared/ProfileAvatar';

// Character limits based on Prisma schema
const BIO_CHAR_LIMIT = 300;
const EXPERIENCE_CHAR_LIMIT = 1000;

interface CoachProfileProps {
  initialProfile: {
    coachProfileId: string;
    bio: string | null;
    experience: string | null;
    specialties: string[];
    teachingStyles: string[];
    headerImage: string | null;
    rate: number;
    isVerified: boolean;
    profileImageUrl?: string | null;
  } | null;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
}

export default function CoachProfile({ initialProfile, firstName, lastName }: CoachProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: initialProfile?.bio || '',
    experience: initialProfile?.experience || '',
    specialties: initialProfile?.specialties || [],
    teachingStyles: initialProfile?.teachingStyles || [],
    headerImage: initialProfile?.headerImage || '',
    rate: initialProfile?.rate || 0,
    profileImage: '',
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newTeachingStyle, setNewTeachingStyle] = useState('');

  const utils = api.useUtils();
  const updateProfile = api.user.updateCoachProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.user.getOrCreateProfile.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };
  
  const handleImageChange = (imageData: string | null) => {
    setFormData({
      ...formData,
      // When null is passed, use empty string to explicitly signal image deletion
      profileImage: imageData === null ? '' : imageData,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      bio: initialProfile?.bio || '',
      experience: initialProfile?.experience || '',
      specialties: initialProfile?.specialties || [],
      teachingStyles: initialProfile?.teachingStyles || [],
      headerImage: initialProfile?.headerImage || '',
      rate: initialProfile?.rate || 0,
      profileImage: '',
    });
    setNewSpecialty('');
    setNewTeachingStyle('');
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const addTeachingStyle = () => {
    if (newTeachingStyle.trim() && !formData.teachingStyles.includes(newTeachingStyle.trim())) {
      setFormData({
        ...formData,
        teachingStyles: [...formData.teachingStyles, newTeachingStyle.trim()],
      });
      setNewTeachingStyle('');
    }
  };

  const removeTeachingStyle = (style: string) => {
    setFormData({
      ...formData,
      teachingStyles: formData.teachingStyles.filter((s) => s !== style),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Coach Profile</h2>
          {initialProfile?.isVerified && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Verified
            </span>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            Edit Coach Profile
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Session Rate</label>
            <p className="text-lg font-semibold">${formData.rate}</p>
          </div>
          
          <ProfileImageDisplay 
            imageUrl={initialProfile?.profileImageUrl} 
            name={firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : null}
            alt="Coach Profile"
          />

          <div>
            <label className="text-sm text-gray-500">Bio</label>
            <p className="text-lg whitespace-pre-wrap">{formData.bio || "Not set"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Experience</label>
            <p className="text-lg whitespace-pre-wrap">{formData.experience || "Not set"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Specialties</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.specialties.length > 0 ? (
                formData.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))
              ) : (
                <p className="text-lg">Not set</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500">Teaching Styles</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.teachingStyles.length > 0 ? (
                formData.teachingStyles.map((style) => (
                  <span
                    key={style}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {style}
                  </span>
                ))
              ) : (
                <p className="text-lg">Not set</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Rate ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Enter session rate"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image
            </label>
            <ProfileImageUploader
              initialImageUrl={initialProfile?.profileImageUrl}
              onChange={handleImageChange}
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
              placeholder="Tell students about yourself (short overview for coach cards)"
              maxLength={BIO_CHAR_LIMIT}
            />
            <p className="text-xs text-gray-500 mt-1">Short overview displayed on coach cards</p>
          </div>

          {/* Experience with character counter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Experience
              </label>
              <span className={`text-xs ${formData.experience.length > EXPERIENCE_CHAR_LIMIT ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.experience.length}/{EXPERIENCE_CHAR_LIMIT}
              </span>
            </div>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className={`w-full px-3 py-2 border ${formData.experience.length > EXPERIENCE_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-h-[100px] resize-y`}
              placeholder="Describe your coaching experience (detailed information for profile page)"
              maxLength={EXPERIENCE_CHAR_LIMIT}
            />
            <p className="text-xs text-gray-500 mt-1">Detailed experience shown on your full profile page</p>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialties
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Add a specialty"
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Teaching Styles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teaching Styles
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTeachingStyle}
                onChange={(e) => setNewTeachingStyle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTeachingStyle())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Add a teaching style"
              />
              <button
                type="button"
                onClick={addTeachingStyle}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.teachingStyles.map((style) => (
                <span
                  key={style}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1"
                >
                  {style}
                  <button
                    type="button"
                    onClick={() => removeTeachingStyle(style)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
