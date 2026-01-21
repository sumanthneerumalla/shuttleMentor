"use client";

import { useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { Users, UserCheck, Search, X } from "lucide-react";
import { Button } from "~/app/_components/shared/Button";
import { SharingType } from "@prisma/client";

interface ClubStudent {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  studentProfile: {
    displayUsername: string | null;
  } | null;
}

interface StudentSelectorProps {
  students: ClubStudent[];
  selectedStudentIds: string[];
  sharingType: SharingType;
  onSharingTypeChange: (sharingType: SharingType) => void;
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

  // Get student display name
  const getStudentDisplayName = (student: ClubStudent) => {
    if (student.studentProfile?.displayUsername) {
      return student.studentProfile.displayUsername;
    }
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    if (student.firstName) {
      return student.firstName;
    }
    return student.email || "Student";
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }

    const query = searchQuery.toLowerCase();
    return students.filter((student) => {
      const displayName = getStudentDisplayName(student).toLowerCase();
      const email = (student.email || "").toLowerCase();
      const firstName = (student.firstName || "").toLowerCase();
      const lastName = (student.lastName || "").toLowerCase();

      return (
        displayName.includes(query) ||
        email.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      );
    });
  }, [students, searchQuery]);

  // Toggle individual student selection
  const toggleStudentSelection = (studentId: string) => {
    const isSelected = selectedStudentIds.includes(studentId);
    const updatedIds = isSelected
      ? selectedStudentIds.filter((id) => id !== studentId)
      : [...selectedStudentIds, studentId];

    onStudentSelectionChange(updatedIds);
  };

  // Select all filtered students
  const selectAllFiltered = () => {
    const allFilteredIds = filteredStudents.map((s) => s.userId);
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
            onClick={() => onSharingTypeChange(SharingType.ALL_STUDENTS)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all",
              sharingType === SharingType.ALL_STUDENTS
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5",
                  sharingType === SharingType.ALL_STUDENTS
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300"
                )}
              >
                {sharingType === SharingType.ALL_STUDENTS && (
                  <div className="w-2 h-2 bg-white rounded-full" />
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

          {/* Specific Students Option */}
          <div
            onClick={() => onSharingTypeChange(SharingType.SPECIFIC_STUDENTS)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all",
              sharingType === SharingType.SPECIFIC_STUDENTS
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5",
                  sharingType === SharingType.SPECIFIC_STUDENTS
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-gray-300"
                )}
              >
                {sharingType === SharingType.SPECIFIC_STUDENTS && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Specific Students
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Choose which students can access this collection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Selection (only shown for SPECIFIC_STUDENTS) */}
      {sharingType === SharingType.SPECIFIC_STUDENTS && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Select Students <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={selectAllFiltered}
                variant="outline"
                size="sm"
                disabled={isLoading || filteredStudents.length === 0}
              >
                Select All
                {searchQuery && filteredStudents.length < students.length && (
                  <span className="ml-1">({filteredStudents.length})</span>
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
                placeholder="Search students by name or email..."
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

          {/* Student List */}
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
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div
                      key={student.userId}
                      onClick={() => toggleStudentSelection(student.userId)}
                      className={cn(
                        "p-3 border-b last:border-b-0 cursor-pointer transition-colors",
                        selectedStudentIds.includes(student.userId)
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mr-3",
                            selectedStudentIds.includes(student.userId)
                              ? "border-[var(--primary)] bg-[var(--primary)]"
                              : "border-gray-300"
                          )}
                        >
                          {selectedStudentIds.includes(student.userId) && (
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
                          <p className="font-medium text-gray-900">
                            {getStudentDisplayName(student)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No students found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {selectedStudentIds.length} student
                  {selectedStudentIds.length !== 1 ? "s" : ""} selected
                  {searchQuery &&
                    filteredStudents.length < students.length &&
                    ` (${filteredStudents.length} shown)`}
                </p>
                {searchQuery && filteredStudents.length < students.length && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Show all students
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-800">
                No students found in your club. Students will need to join your
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
