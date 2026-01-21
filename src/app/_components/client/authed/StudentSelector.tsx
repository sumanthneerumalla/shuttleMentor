"use client";

import { useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Users, UserCheck, Search, X } from "lucide-react";
import { Button } from "~/app/_components/shared/Button";
import { SharingType } from "@prisma/client";

interface ClubUser {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  userType: "STUDENT" | "COACH";
  studentProfile: {
    displayUsername: string | null;
  } | null;
  coachProfile: {
    displayUsername: string | null;
  } | null;
}

interface StudentSelectorProps {
  students: ClubUser[];
  selectedStudentIds: string[];
  sharingType: SharingType[];  // Changed to array to support multiple selections
  onSharingTypeChange: (sharingType: SharingType[]) => void;  // Changed to array
  onStudentSelectionChange: (studentIds: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export default function StudentSelector({
  students,
  selectedStudentIds,
  sharingType,
  onSharingTypeChange,
  onStudentSelectionChange,
  isLoading = false,
  error = null,
  className,
}: StudentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle sharing type - checkbox behavior (independent selections)
  const toggleSharingType = (type: SharingType) => {
    const currentTypes = [...sharingType];
    const index = currentTypes.indexOf(type);
    
    if (index > -1) {
      // Remove if already selected (uncheck)
      currentTypes.splice(index, 1);
    } else {
      // Add if not selected (check)
      currentTypes.push(type);
    }
    
    onSharingTypeChange(currentTypes);
  };

  // Check if a sharing type is selected
  const isSharingTypeSelected = (type: SharingType) => {
    return sharingType.includes(type);
  };

  // Check if specific users section should be shown
  const showSpecificUsers = isSharingTypeSelected(SharingType.SPECIFIC_USERS);

  // Get user display name
  const getUserDisplayName = (user: ClubUser) => {
    // Check for display username based on user type
    if (user.userType === "STUDENT" && user.studentProfile?.displayUsername) {
      return user.studentProfile.displayUsername;
    }
    if (user.userType === "COACH" && user.coachProfile?.displayUsername) {
      return user.coachProfile.displayUsername;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email || (user.userType === "COACH" ? "Coach" : "Student");
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }

    const query = searchQuery.toLowerCase();
    return students.filter((user) => {
      const displayName = getUserDisplayName(user).toLowerCase();
      const email = (user.email || "").toLowerCase();
      const firstName = (user.firstName || "").toLowerCase();
      const lastName = (user.lastName || "").toLowerCase();
      const userType = user.userType.toLowerCase();

      return (
        displayName.includes(query) ||
        email.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        userType.includes(query)
      );
    });
  }, [students, searchQuery]);

  // Toggle individual user selection
  const toggleUserSelection = (userId: string) => {
    const isSelected = selectedStudentIds.includes(userId);
    const updatedIds = isSelected
      ? selectedStudentIds.filter((id) => id !== userId)
      : [...selectedStudentIds, userId];

    onStudentSelectionChange(updatedIds);
  };

  // Select all filtered users
  const selectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map((u) => u.userId);
    const newSelectedIds = [
      ...new Set([...selectedStudentIds, ...allFilteredIds]),
    ];
    onStudentSelectionChange(newSelectedIds);
  };

  // Deselect all students
  const deselectAll = () => {
    onStudentSelectionChange([]);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Sharing Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Who can access this collection? <span className="text-red-500">*</span>
        </label>

        <div className="space-y-3">
          {/* All Students Option */}
          <div
            onClick={() => toggleSharingType(SharingType.ALL_STUDENTS)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all",
              isSharingTypeSelected(SharingType.ALL_STUDENTS)
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start">
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5",
                  isSharingTypeSelected(SharingType.ALL_STUDENTS)
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300"
                )}
              >
                {isSharingTypeSelected(SharingType.ALL_STUDENTS) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    All Students in My Club
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically share with all current and future students in
                  your club
                </p>
              </div>
            </div>
          </div>

          {/* All Coaches Option */}
          <div
            onClick={() => toggleSharingType(SharingType.ALL_COACHES)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all",
              isSharingTypeSelected(SharingType.ALL_COACHES)
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start">
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5",
                  isSharingTypeSelected(SharingType.ALL_COACHES)
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300"
                )}
              >
                {isSharingTypeSelected(SharingType.ALL_COACHES) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    All Coaches in My Club
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically share with all current and future coaches in
                  your club
                </p>
              </div>
            </div>
          </div>

          {/* Specific Users Option */}
          <div
            onClick={() => toggleSharingType(SharingType.SPECIFIC_USERS)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all",
              isSharingTypeSelected(SharingType.SPECIFIC_USERS)
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start">
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5",
                  isSharingTypeSelected(SharingType.SPECIFIC_USERS)
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300"
                )}
              >
                {isSharingTypeSelected(SharingType.SPECIFIC_USERS) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Specific Users
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Choose which students and/or coaches can access this collection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Selection (only shown for SPECIFIC_USERS) */}
      {showSpecificUsers && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Select Users <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={selectAllFiltered}
                variant="outline"
                size="sm"
                disabled={isLoading || filteredUsers.length === 0}
              >
                Select All
                {searchQuery && filteredUsers.length < students.length && (
                  <span className="ml-1">({filteredUsers.length})</span>
                )}
              </Button>
              <Button
                type="button"
                onClick={deselectAll}
                variant="outline"
                size="sm"
                disabled={selectedStudentIds.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {students.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or user type..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* User List */}
          {isLoading ? (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : students.length > 0 ? (
            <>
              <div
                className={cn(
                  "border rounded-lg max-h-64 overflow-y-auto",
                  error ? "border-red-300" : "border-gray-200"
                )}
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => toggleUserSelection(user.userId)}
                      className={cn(
                        "p-3 border-b last:border-b-0 cursor-pointer transition-colors",
                        selectedStudentIds.includes(user.userId)
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mr-3",
                            selectedStudentIds.includes(user.userId)
                              ? "border-[var(--primary)] bg-[var(--primary)]"
                              : "border-gray-300"
                          )}
                        >
                          {selectedStudentIds.includes(user.userId) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {getUserDisplayName(user)}
                            </p>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full",
                                user.userType === "COACH"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {user.userType === "COACH" ? "Coach" : "Student"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {selectedStudentIds.length} user
                  {selectedStudentIds.length !== 1 ? "s" : ""} selected
                  {searchQuery &&
                    filteredUsers.length < students.length &&
                    ` (${filteredUsers.length} shown)`}
                </p>
                {searchQuery && filteredUsers.length < students.length && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Show all users
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-800">
                No users found in your club. Students and coaches will need to join your
                club before you can share collections with them.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <X className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
