"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import StudentProfile from "../_components/client/StudentProfile";
import CoachProfile from "../_components/client/CoachProfile";
import { parseServerError } from "~/lib/validation";
import AdminClubIdSelector from "../_components/client/authed/AdminClubIdSelector";

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch or create user profile
  const { data: user, isLoading, refetch } = api.user.getOrCreateProfile.useQuery();
  
  // Mutations
  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setServerError("");
      refetch();
    },
    onError: (error) => {
      // Parse server-side validation errors
      const parsedErrors = parseServerError(error.message);
      
      // Set general error if any
      if (parsedErrors.general) {
        setServerError(parsedErrors.general);
      }
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    timeZone: "",
    clubId: "",
    clubName: "",
  });

  const [serverError, setServerError] = useState<string>("");

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        timeZone: user.timeZone || "",
        clubId: user.clubId || "",
        clubName: user.clubName || "",
      });
      setServerError("");
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    
    // Store current form data in case we need to restore it on error
    const currentFormData = { ...formData };
    
    updateProfile.mutate(formData, {
      onError: () => {
        // Preserve form data on error so user doesn't lose their changes
        setFormData(currentFormData);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setServerError("");
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        timeZone: user.timeZone || "",
        clubId: user.clubId || "",
        clubName: user.clubName || "",
      });
    }
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            
            {isLoading ? (
              <div className="text-center py-8">Loading profile...</div>
            ) : user ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 select-text">
                    User ID: <span className="font-mono select-all cursor-text">{user.userId}</span>
                  </p>
                </div>
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <div>
                          <label className="text-sm text-gray-500">Name</label>
                          <p className="text-lg font-medium">
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : "Not set"}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <p className="text-lg">{user.email || "Not set"}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Time Zone</label>
                          <p className="text-lg">{user.timeZone || "Not set"}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Club</label>
                          <p className="text-lg">{user.clubName || "Not set"}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Account Type</label>
                          <p className="text-lg capitalize">{user.userType.toLowerCase()}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Member Since</label>
                          <p className="text-lg">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setFormData({
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            email: user.email || "",
                            timeZone: user.timeZone || "",
                            clubId: user.clubId || "",
                            clubName: user.clubName || "",
                          });
                          setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display server error if any */}
                    {serverError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{serverError}</p>
                        <button
                          type="button"
                          onClick={() => setServerError("")}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    
                    {/* Display success message if update was successful */}
                    {updateProfile.isSuccess && !isEditing && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">Profile updated successfully!</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                          placeholder="Enter first name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        placeholder="Enter email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Zone
                      </label>
                      <select
                        value={formData.timeZone}
                        onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      >
                        <option value="">Select time zone</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEDT)</option>
                      </select>
                    </div>

                    {user.userType === "ADMIN" ? (
                      <AdminClubIdSelector
                        selectedClubId={formData.clubId}
                        selectedClubName={formData.clubName}
                        onSelect={(club) => {
                          setFormData({
                            ...formData,
                            clubId: club.clubId,
                            clubName: club.clubName,
                          });
                        }}
                      />
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Club
                        </label>
                        <input
                          type="text"
                          value={formData.clubName ? `${formData.clubName} (${formData.clubId})` : formData.clubId}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : (
              <div className="text-center py-8">No profile found</div>
            )}

            {/* Student Profile Section */}
            {user?.studentProfile && user.userType === "STUDENT" && (
              <div className="mt-6">
                <StudentProfile 
                  initialProfile={user.studentProfile} 
                  userId={user.userId}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  clubName={user.clubName}
                />
              </div>
            )}

            {/* Coach Profile Section */}
            {user?.coachProfile && user.userType === "COACH" && (
              <div className="mt-6">
                <CoachProfile 
                  initialProfile={user.coachProfile} 
                  userId={user.userId}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  clubName={user.clubName}
                />
              </div>
            )}

            {/* Admin can see both profiles */}
            {user?.userType === "ADMIN" && (
              <>
                {user.studentProfile && (
                  <div className="mt-6">
                    <StudentProfile 
                      initialProfile={user.studentProfile} 
                      userId={user.userId}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      clubName={user.clubName}
                    />
                  </div>
                )}
                {user.coachProfile && (
                  <div className="mt-6">
                    <CoachProfile 
                      initialProfile={user.coachProfile} 
                      userId={user.userId}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      clubName={user.clubName}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}