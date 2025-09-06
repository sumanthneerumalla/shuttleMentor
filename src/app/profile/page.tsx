"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch or create user profile
  const { data: user, isLoading, refetch } = api.user.getOrCreateProfile.useQuery();
  
  // Mutations
  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    timeZone: "",
  });

  // Initialize form when user data loads
  useState(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        timeZone: user.timeZone || "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        timeZone: user.timeZone || "",
      });
    }
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            
            {isLoading ? (
              <div className="text-center py-8">Loading profile...</div>
            ) : user ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            ) : (
              <div className="text-center py-8">No profile found</div>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}