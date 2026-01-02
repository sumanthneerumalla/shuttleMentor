# Implementation Plan

## Overview
This implementation plan covers the ShuttleMentor badminton coaching platform. The system is already partially implemented with user authentication, profile management, coach discovery, and video collections. This plan focuses on adding comprehensive testing, fixing any gaps, and implementing remaining features.

---

## Phase 1: Testing Infrastructure and Core Validation

- [ ] 1. Set up testing infrastructure
  - Install and configure Vitest as the test runner
  - Install fast-check for property-based testing
  - Configure test environment with database mocking
  - Set up test utilities for creating test data
  - Create test database configuration
  - _Requirements: 14.1, 14.2_

- [ ]* 1.1 Write property test for user record creation on authentication
  - **Property 1: User Record Creation on Authentication**
  - **Validates: Requirements 1.2**
  - Generate random Clerk user IDs and verify User records are created
  - Test that subsequent authentications retrieve existing records
  - _Requirements: 1.2_

- [ ]* 1.2 Write property test for profile update persistence
  - **Property 2: Profile Update Persistence**
  - **Validates: Requirements 2.2**
  - Generate random profile updates and verify persistence
  - Test that updates are retrievable in subsequent queries
  - _Requirements: 2.2_

- [ ] 2. Implement and test display username validation
  - Create username validation utility functions
  - Implement format validation (3-30 chars, starts with letter, alphanumeric + underscore)
  - Implement lowercase normalization
  - Add URL-safe validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 2.1 Write property test for display username format validation
  - **Property 14: Display Username Format Validation**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Generate valid usernames and verify acceptance
  - Generate invalid usernames (too short, too long, starts with number, special chars) and verify rejection
  - Test lowercase normalization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Implement and test profile image handling
  - Create image processing utilities (base64 encoding/decoding)
  - Implement size validation (max 5MB)
  - Add MIME type handling
  - Create binary-to-base64 conversion functions
  - _Requirements: 2.4, 2.5, 11.1, 11.2, 11.3_

- [ ]* 3.1 Write property test for profile image round trip
  - **Property 4: Profile Image Round Trip**
  - **Validates: Requirements 2.4, 11.1, 11.2, 11.3**
  - Generate random image data and MIME types
  - Test base64 encoding, storage, and retrieval
  - Verify data integrity through round trip
  - _Requirements: 2.4, 11.1, 11.2, 11.3_

- [ ]* 3.2 Write property test for image size validation
  - **Property 5: Image Size Validation**
  - **Validates: Requirements 2.5**
  - Generate images of various sizes
  - Verify rejection of images over 5MB
  - Verify acceptance of images under 5MB
  - _Requirements: 2.5_

---

## Phase 2: Student and Coach Profile Testing

- [ ] 4. Test student profile management
  - Review existing student profile implementation
  - Verify field acceptance and persistence
  - Test username uniqueness constraints
  - Test user-profile relationship
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for student profile field acceptance
  - **Property 6: Student Profile Field Acceptance**
  - **Validates: Requirements 3.1, 3.3**
  - Generate random student profile data
  - Verify all fields are accepted and persisted
  - Test profile updates
  - _Requirements: 3.1, 3.3_

- [ ]* 4.2 Write property test for student username uniqueness
  - **Property 7: Student Username Uniqueness**
  - **Validates: Requirements 3.2, 12.2**
  - Generate random usernames
  - Test that duplicate usernames are rejected
  - Test case-insensitive uniqueness
  - _Requirements: 3.2, 12.2_

- [ ]* 4.3 Write property test for student-user relationship
  - **Property 8: Student-User Relationship**
  - **Validates: Requirements 3.4, 3.5**
  - Create student profiles and verify user linkage
  - Test cascade deletion behavior
  - _Requirements: 3.4, 3.5_

- [ ] 5. Test coach profile management
  - Review existing coach profile implementation
  - Verify field acceptance and persistence
  - Test bio and experience length validation
  - Test username uniqueness constraints
  - Test data type storage (arrays, integers)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ]* 5.1 Write property test for coach profile field acceptance
  - **Property 9: Coach Profile Field Acceptance**
  - **Validates: Requirements 4.1**
  - Generate random coach profile data
  - Verify all fields are accepted and persisted
  - Test profile updates
  - _Requirements: 4.1_

- [ ]* 5.2 Write property test for coach bio and experience length validation
  - **Property 10: Coach Bio and Experience Length Validation**
  - **Validates: Requirements 4.2, 4.3**
  - Generate bios and experiences of various lengths
  - Verify rejection when exceeding limits (300 for bio, 1000 for experience)
  - Verify acceptance within limits
  - _Requirements: 4.2, 4.3_

- [ ]* 5.3 Write property test for coach username uniqueness
  - **Property 11: Coach Username Uniqueness**
  - **Validates: Requirements 4.4, 12.3**
  - Generate random usernames
  - Test that duplicate usernames are rejected
  - Test case-insensitive uniqueness
  - _Requirements: 4.4, 12.3_

- [ ]* 5.4 Write property test for coach data type storage
  - **Property 12: Coach Data Type Storage**
  - **Validates: Requirements 4.5, 4.6**
  - Generate coach profiles with various data types
  - Verify specialties and teachingStyles are stored as arrays
  - Verify rate is stored as integer with default of 0
  - _Requirements: 4.5, 4.6_

- [ ]* 5.5 Write property test for coach-user relationship
  - **Property 13: Coach-User Relationship**
  - **Validates: Requirements 4.7, 4.8**
  - Create coach profiles and verify user linkage
  - Test cascade deletion behavior
  - _Requirements: 4.7, 4.8_

---

## Phase 3: Coach Discovery and Display Testing

- [ ] 6. Test coach discovery functionality
  - Review existing coach listing implementation
  - Test filtering by specialties, teaching styles, rate range, verification
  - Test search functionality
  - Test sorting options
  - Test pagination
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 6.1 Write property test for coach listing completeness
  - **Property 15: Coach Listing Completeness**
  - **Validates: Requirements 6.1, 6.2**
  - Generate random coach profiles
  - Verify all coaches are returned with required fields
  - Test that admins with coach profiles are included
  - _Requirements: 6.1, 6.2_

- [ ]* 6.2 Write property test for coach profile resolution
  - **Property 16: Coach Profile Resolution**
  - **Validates: Requirements 6.4, 6.5**
  - Generate coaches with displayUsernames
  - Test resolution by displayUsername
  - Test fallback resolution by coachProfileId
  - _Requirements: 6.4, 6.5_

- [ ] 7. Test coach profile display
  - Review existing coach detail page implementation
  - Verify all required fields are displayed
  - Test binary to base64 conversion for images
  - Test not-found handling
  - _Requirements: 7.1, 7.4, 7.5_

- [ ]* 7.1 Write property test for coach profile display completeness
  - **Property 17: Coach Profile Display Completeness**
  - **Validates: Requirements 7.1, 7.5**
  - Generate random coach profiles
  - Verify all required fields are in response
  - Test that createdAt date is included
  - _Requirements: 7.1, 7.5_

- [ ]* 7.2 Write property test for binary to base64 conversion
  - **Property 18: Binary to Base64 Conversion**
  - **Validates: Requirements 7.4**
  - Generate coaches with binary profile images
  - Verify conversion to base64 data URLs
  - Test MIME type handling
  - _Requirements: 7.4_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Video Collection Management Testing

- [ ] 9. Test video collection creation and management
  - Review existing video collection implementation
  - Test collection creation requirements
  - Test soft deletion behavior
  - Test filtering of deleted records
  - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [ ]* 9.1 Write property test for video collection creation requirements
  - **Property 19: Video Collection Creation Requirements**
  - **Validates: Requirements 8.1, 8.3**
  - Generate random collection data
  - Verify title is required
  - Verify optional fields are accepted
  - Verify userId linkage
  - _Requirements: 8.1, 8.3_

- [ ]* 9.2 Write property test for soft deletion behavior
  - **Property 20: Soft Deletion Behavior**
  - **Validates: Requirements 8.5, 9.5, 13.1, 13.2, 13.3, 13.4**
  - Generate random collections and media
  - Test soft deletion sets isDeleted=true and records deletedAt
  - Verify records remain in database
  - Test for both collections and media
  - _Requirements: 8.5, 9.5, 13.1, 13.2, 13.3, 13.4_

- [ ]* 9.3 Write property test for soft deletion filtering
  - **Property 21: Soft Deletion Filtering**
  - **Validates: Requirements 8.4, 9.4, 13.5**
  - Create collections and media, then soft delete some
  - Verify queries exclude soft-deleted records by default
  - Test for both collections and media
  - _Requirements: 8.4, 9.4, 13.5_

- [ ] 10. Test media management
  - Review existing media implementation
  - Test media creation requirements
  - Test URL vs file-based media
  - Test cascade soft deletion
  - _Requirements: 9.1, 9.2, 9.3, 9.6_

- [ ]* 10.1 Write property test for media creation requirements
  - **Property 22: Media Creation Requirements**
  - **Validates: Requirements 9.1, 9.2, 9.3**
  - Generate random media data for both URL and file types
  - Verify title and collectionId are required
  - Verify appropriate fields are stored based on mediaType
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 10.2 Write property test for cascade soft deletion
  - **Property 23: Cascade Soft Deletion**
  - **Validates: Requirements 9.6**
  - Create collections with media
  - Delete collections
  - Verify all associated media are soft-deleted
  - _Requirements: 9.6_

---

## Phase 5: Access Control Testing

- [ ] 11. Test video collection access control
  - Review existing access control implementation
  - Test student access restrictions
  - Test coach and admin access
  - Test creation permissions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ]* 11.1 Write property test for student video collection access
  - **Property 24: Student Video Collection Access**
  - **Validates: Requirements 10.1**
  - Create collections for multiple students
  - Verify each student sees only their own collections
  - Verify soft-deleted collections are excluded
  - _Requirements: 10.1_

- [ ]* 11.2 Write property test for coach and admin video collection access
  - **Property 25: Coach and Admin Video Collection Access**
  - **Validates: Requirements 10.2, 10.3, 10.4**
  - Create collections for multiple students
  - Verify coaches and admins see all collections
  - Verify creator information is included
  - Verify soft-deleted collections are excluded
  - _Requirements: 10.2, 10.3, 10.4_

- [ ]* 11.3 Write property test for video collection creation permissions
  - **Property 26: Video Collection Creation Permissions**
  - **Validates: Requirements 10.5, 10.6, 10.7**
  - Test creation attempts by different user types
  - Verify students and admins can create
  - Verify coaches and facilities cannot create
  - _Requirements: 10.5, 10.6, 10.7_

---

## Phase 6: Media Coaching Notes Implementation

- [x] 12. Implement MediaCoachNote database model
  - Add MediaCoachNote model to Prisma schema
  - Create foreign key relationships to Media and User (Coach)
  - Add database indexes for mediaId and coachId
  - Generate and run database migration
  - _Requirements: 17.1_

- [ ]* 12.1 Write property test for MediaCoachNote model relationships
  - **Property 38: MediaCoachNote Model Relationships**
  - **Validates: Requirements 17.1**
  - Generate random coaching notes
  - Verify proper foreign key relationships to Media and Coach
  - Test relationship integrity
  - _Requirements: 17.1_

- [x] 13. Implement coaching notes tRPC router
  - Create coachingNotesRouter with CRUD operations
  - Add createNote, updateNote, deleteNote, getNotesByMedia procedures
  - Implement access control (COACH and ADMIN only)
  - Add Zod validation schemas for note content (max 2000 chars)
  - _Requirements: 16.1, 16.4, 17.4_

- [ ]* 13.1 Write property test for coaching note required fields
  - **Property 33: Coaching Note Required Fields**
  - **Validates: Requirements 16.1**
  - Generate note creation attempts with missing fields
  - Verify mediaId, coachId, and content are required
  - Test validation error messages
  - _Requirements: 16.1_

- [ ]* 13.2 Write property test for note content length validation
  - **Property 36: Note Content Length Validation**
  - **Validates: Requirements 16.4**
  - Generate notes with various content lengths
  - Verify rejection when exceeding 2000 characters
  - Verify acceptance within limits
  - _Requirements: 16.4_

- [ ]* 13.3 Write property test for coaching note access control
  - **Property 40: Coaching Note Access Control**
  - **Validates: Requirements 17.4**
  - Test note creation attempts by different user types
  - Verify only COACH and ADMIN can create notes
  - Verify STUDENT and FACILITY are rejected
  - _Requirements: 17.4_

- [x] 14. Implement coaching note persistence and retrieval
  - Add note creation with timestamp and coach identification
  - Implement note updates preserving creation timestamp
  - Add note deletion functionality
  - Include coach profile information in note queries
  - _Requirements: 15.4, 16.2, 15.5, 16.3_

- [ ]* 14.1 Write property test for coaching note persistence
  - **Property 31: Coaching Note Persistence**
  - **Validates: Requirements 15.4**
  - Generate random coaching notes
  - Verify persistence with correct mediaId, coachId, content, and timestamps
  - Test both creation and updates
  - _Requirements: 15.4_

- [ ]* 14.2 Write property test for timestamp preservation on update
  - **Property 34: Timestamp Preservation on Update**
  - **Validates: Requirements 16.2**
  - Create notes, then update them
  - Verify createdAt remains unchanged
  - Verify updatedAt is updated to current time
  - _Requirements: 16.2_

- [ ]* 14.3 Write property test for coaching note deletion
  - **Property 32: Coaching Note Deletion**
  - **Validates: Requirements 15.5**
  - Create notes, then delete them
  - Verify note is removed while Media record is preserved
  - _Requirements: 15.5_

- [ ]* 14.4 Write property test for coaching note display completeness
  - **Property 35: Coaching Note Display Completeness**
  - **Validates: Requirements 16.3**
  - Generate notes and query them
  - Verify response includes Coach name, note content, creation date, and last modified date
  - _Requirements: 16.3_

- [x] 15. Update media queries to include coaching notes
  - Modify existing media retrieval to include coaching notes
  - Add coach profile information to note responses
  - Ensure notes are included when coaches view media
  - Update video collection router to support coach media access
  - _Requirements: 15.1, 15.2, 15.3, 17.3_

- [ ]* 15.1 Write property test for coach media access
  - **Property 29: Coach Media Access**
  - **Validates: Requirements 15.1, 15.2**
  - Create media from multiple students
  - Verify coaches can view all media with student information
  - Test inclusion of collection title and media details
  - _Requirements: 15.1, 15.2_

- [ ]* 15.2 Write property test for coaching notes inclusion
  - **Property 30: Coaching Notes Inclusion**
  - **Validates: Requirements 15.3**
  - Create media with and without coaching notes
  - Verify notes are included when coaches view media
  - Test coach identification and timestamps in responses
  - _Requirements: 15.3_

- [ ]* 15.3 Write property test for coaching note query completeness
  - **Property 39: Coaching Note Query Completeness**
  - **Validates: Requirements 17.3**
  - Query coaching notes
  - Verify Coach profile information and Media details are included
  - Test proper relationship joins
  - _Requirements: 17.3_

- [x] 16. Implement note preservation during media soft deletion
  - Modify media soft deletion to preserve coaching notes
  - Ensure notes remain accessible for audit purposes
  - Update queries to handle soft-deleted media with notes
  - _Requirements: 16.5_

- [ ]* 16.1 Write property test for note preservation during media soft deletion
  - **Property 37: Note Preservation During Media Soft Deletion**
  - **Validates: Requirements 16.5**
  - Create media with coaching notes
  - Soft delete the media
  - Verify notes remain accessible for audit purposes
  - _Requirements: 16.5_

- [x] 17. Create coaching notes UI components
  - Create CoachingNoteForm component for adding/editing notes
  - Create CoachingNotesList component for displaying notes
  - Add coaching notes section to media detail view
  - Implement note editing and deletion UI
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 17.1 Write unit tests for coaching notes UI components
  - Test note form validation and submission
  - Test notes list rendering and interactions
  - Test edit and delete functionality
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18. Checkpoint - Ensure all coaching notes tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Dashboard Metrics Implementation

- [x] 19. Implement coach dashboard metrics API endpoints
  - Create getCoachDashboardMetrics tRPC procedure
  - Add student count calculation (unique students with media accessible to coach)
  - Add weekly coaching notes count calculation (current week Monday-Sunday)
  - Implement date range utilities for week calculation
  - Add proper access control (COACH and ADMIN only)
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ]* 19.1 Write property test for student count calculation
  - **Property 41: Student Count Calculation**
  - **Validates: Requirements 18.1**
  - Generate random students with media collections
  - Verify count reflects unique students with accessible media
  - Test that soft-deleted media doesn't affect count
  - _Requirements: 18.1_

- [ ]* 19.2 Write property test for weekly coaching notes count
  - **Property 42: Weekly Coaching Notes Count**
  - **Validates: Requirements 18.2, 18.3**
  - Generate coaching notes across different weeks
  - Verify count includes only notes from current week (Monday-Sunday)
  - Test week boundary calculations
  - _Requirements: 18.2, 18.3_

- [ ]* 19.3 Write property test for dashboard metrics access control
  - **Property 43: Dashboard Metrics Access Control**
  - **Validates: Requirements 18.1, 18.2**
  - Test metrics access by different user types
  - Verify only COACH and ADMIN can access metrics
  - Verify STUDENT and FACILITY are rejected
  - _Requirements: 18.1, 18.2_

- [x] 20. Update dashboard UI to use real metrics
  - Modify dashboard component to call getCoachDashboardMetrics
  - Replace hardcoded "0" values with actual API data
  - Add loading states for metrics
  - Handle error states gracefully
  - Ensure real-time updates when data changes
  - _Requirements: 18.4, 18.5_

- [ ]* 20.1 Write unit tests for dashboard metrics UI
  - Test metrics loading and display
  - Test loading states
  - Test error handling
  - Test zero value display
  - _Requirements: 18.4, 18.5_

- [x] 21. Implement week calculation utilities
  - Create utility functions for current week start/end dates
  - Handle timezone considerations
  - Add date range validation
  - Test week boundary edge cases (Sunday/Monday transitions)
  - _Requirements: 18.3_

- [ ]* 21.1 Write property test for week calculation utilities
  - **Property 44: Week Calculation Utilities**
  - **Validates: Requirements 18.3**
  - Generate random dates and verify correct week boundaries
  - Test Monday 00:00 to Sunday 23:59 calculation
  - Test timezone handling
  - _Requirements: 18.3_

- [x] 22. Checkpoint - Ensure dashboard metrics tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 8: Data Integrity and Validation Testing

- [ ] 23. Test data integrity constraints
  - Review database schema constraints
  - Test unique constraints
  - Test foreign key relationships
  - Test cascade deletion
  - _Requirements: 12.1, 12.7_

- [ ]* 23.1 Write property test for Clerk user ID uniqueness
  - **Property 27: Clerk User ID Uniqueness**
  - **Validates: Requirements 12.1**
  - Attempt to create users with duplicate clerkUserIds
  - Verify uniqueness constraint is enforced
  - _Requirements: 12.1_

- [ ] 24. Test input validation with Zod
  - Review existing Zod schemas
  - Test validation error messages
  - Test edge cases for all input types
  - _Requirements: 14.2, 14.5_

- [ ]* 24.1 Write property test for input validation with Zod
  - **Property 28: Input Validation with Zod**
  - **Validates: Requirements 14.2, 14.5**
  - Generate valid and invalid inputs for all API endpoints
  - Verify Zod validation rejects invalid inputs
  - Verify descriptive error messages are returned
  - _Requirements: 14.2, 14.5_

- [ ] 25. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 9: Additional Features and Enhancements

- [ ] 26. Implement coach filtering UI
  - Create CoachFilters component with specialties multi-select
  - Add teaching styles multi-select
  - Add rate range slider
  - Add verification toggle
  - Add sort options dropdown
  - Connect filters to existing API endpoint
  - _Requirements: 6.1, 6.2_

- [ ]* 26.1 Write unit tests for coach filtering UI
  - Test filter state management
  - Test filter application
  - Test filter reset functionality
  - _Requirements: 6.1, 6.2_

- [ ] 27. Enhance coach profile pages
  - Add booking interface placeholder
  - Add reviews section placeholder
  - Improve header image display
  - Add social sharing metadata
  - _Requirements: 7.1_

- [ ]* 27.1 Write unit tests for coach profile enhancements
  - Test component rendering
  - Test responsive layout
  - Test image loading states
  - _Requirements: 7.1_

- [ ] 28. Implement username availability checking
  - Create API endpoint for username availability
  - Add real-time validation in profile forms
  - Show availability feedback to users
  - _Requirements: 3.2, 4.4_

- [ ]* 28.1 Write unit tests for username availability checking
  - Test availability check API
  - Test UI feedback
  - Test debouncing of checks
  - _Requirements: 3.2, 4.4_

- [ ] 29. Add profile image cropping improvements
  - Enhance react-image-crop integration
  - Add aspect ratio presets
  - Add zoom controls
  - Improve mobile experience
  - _Requirements: 11.5_

- [ ]* 29.1 Write unit tests for image cropping
  - Test crop area calculation
  - Test aspect ratio enforcement
  - Test image quality preservation
  - _Requirements: 11.5_

---

## Phase 10: Documentation and Deployment

- [ ] 30. Update documentation
  - Update README with testing instructions
  - Document API endpoints
  - Add contribution guidelines
  - Create deployment guide
  - _Requirements: All_

- [ ] 31. Prepare for deployment
  - Review environment configuration
  - Test Docker builds
  - Verify database migrations
  - Set up monitoring and logging
  - _Requirements: All_

- [ ] 32. Final system test
  - Run all tests in CI/CD pipeline
  - Perform manual testing of critical paths
  - Verify performance benchmarks
  - Check security configurations
  - _Requirements: All_
