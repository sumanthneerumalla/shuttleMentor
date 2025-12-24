# Implementation Plan

- [x] 1. Update database schema and create migration
  - Add clubId and clubName fields to User model in Prisma schema
  - Set default values for both fields
  - Create and test database migration
  - Verify migration applies default values to existing users
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 5.1, 5.2, 5.3_

- [x] 2. Update tRPC API to handle club data
  - [x] 2.1 Add club fields to Zod validation schemas
    - Update user profile input schemas to include clubId and clubName
    - Add validation rules for club data format and length
    - Ensure type safety for club fields
    - _Requirements: 6.2, 6.4, 6.5, 8.1, 8.2_

  - [x] 2.2 Update getOrCreateProfile query to include club data
    - Ensure club fields are returned in user profile responses
    - Apply default club values for new users
    - _Requirements: 1.2, 1.5, 6.1, 6.3_

  - [x] 2.3 Update updateProfile mutation to handle club data
    - Accept clubId and clubName in input
    - Validate and sanitize club data
    - Persist club updates to database
    - _Requirements: 4.2, 6.2, 8.3_

  - [ ]* 2.4 Write property test for club data persistence
    - **Property 3: Club data persistence**
    - **Validates: Requirements 4.2, 6.2**

  - [ ]* 2.5 Write property test for API input sanitization
    - **Property 8: Input sanitization**
    - **Validates: Requirements 8.3**

  - [ ]* 2.6 Write property test for user club data completeness
    - **Property 1: User club data completeness**
    - **Validates: Requirements 1.1, 1.5, 6.1**

  - [ ]* 2.7 Write unit tests for API validation
    - Test clubId format validation
    - Test clubName length validation
    - Test error responses for invalid inputs
    - _Requirements: 6.5, 8.1, 8.2, 8.4_

- [x] 3. Update profile display components
  - [x] 3.1 Add club information to profile page display
    - Update profile page to show club name
    - Display club information in read-only mode
    - Format club information consistently
    - _Requirements: 3.1, 3.2, 7.3_

  - [x] 3.2 Add club fields to profile edit form
    - Add clubId and clubName input fields
    - Pre-populate fields with current values
    - Add labels and help text for club fields
    - _Requirements: 4.1, 7.1, 7.2_

  - [ ]* 3.3 Write property test for profile display
    - **Property 4: Profile display includes club information**
    - **Validates: Requirements 3.1, 3.2, 3.4, 7.3**

  - [ ]* 3.4 Write property test for profile edit form completeness
    - **Property 7: Profile edit form completeness**
    - **Validates: Requirements 4.1, 7.1**

  - [ ]* 3.5 Write unit tests for profile components
    - Test club information rendering
    - Test form field population
    - Test form submission with club data
    - _Requirements: 7.2, 7.3_

- [x] 4. Update coach listing and card components
  - [x] 4.1 Add club name to coach card display
    - Update CoachCard component to show club name
    - Ensure consistent formatting with other profile displays
    - _Requirements: 3.4_

  - [x] 4.2 Add club information to coach detail page
    - Update CoachDetail component to display club name
    - Ensure club information is prominently displayed
    - _Requirements: 3.2_

  - [x] 4.3 Update coaches listing to include club data
    - Ensure club information is fetched with coach data
    - Display club names in coach listings
    - _Requirements: 3.3_

  - [ ]* 4.4 Write property test for user list club information
    - **Property 10: User list club information**
    - **Validates: Requirements 3.3**

  - [ ]* 4.5 Write unit tests for coach components
    - Test club name display in coach cards
    - Test club information in coach detail page
    - Test club data in coach listings
    - _Requirements: 3.2, 3.4_

- [x] 5. Implement client-side validation
  - [x] 5.1 Add form validation for club fields
    - Validate clubId format on client side
    - Validate clubName length on client side
    - Display validation errors to users
    - _Requirements: 4.5, 7.5, 8.1, 8.2, 8.4_

  - [x] 5.2 Implement error handling for club updates
    - Handle validation errors gracefully
    - Preserve existing values on failed updates
    - Display helpful error messages
    - _Requirements: 8.4, 8.5_

  - [ ]* 5.3 Write property test for club ID validation
    - **Property 5: Club ID validation**
    - **Validates: Requirements 4.5, 8.1**

  - [ ]* 5.4 Write property test for club name validation
    - **Property 6: Club name validation**
    - **Validates: Requirements 4.5, 8.2**

  - [ ]* 5.5 Write property test for invalid data rejection
    - **Property 7: Invalid data rejection**
    - **Validates: Requirements 8.5**

  - [ ]* 5.6 Write unit tests for validation logic
    - Test clubId format validation edge cases
    - Test clubName length boundary conditions
    - Test error message content
    - _Requirements: 7.5, 8.4_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update student and coach profile components
  - [x] 7.1 Update StudentProfile component to display club
    - Show club name in student profile view
    - Ensure club information inherits from User record
    - _Requirements: 2.3, 3.1_

  - [x] 7.2 Update CoachProfile component to display club
    - Show club name in coach profile view
    - Ensure club information inherits from User record
    - _Requirements: 2.4, 3.2_

  - [ ]* 7.3 Write unit tests for profile inheritance
    - Test student profile club data inheritance
    - Test coach profile club data inheritance
    - _Requirements: 2.3, 2.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extend database schema for media collection coach assignments
  - Add assignedCoachId field to VideoCollection model in Prisma schema
  - Set up optional relation to User model for assigned coach
  - Create and test database migration
  - Verify migration applies to existing collections
  - _Requirements: 12.1, 12.3, 12.4_

- [x] 10. Implement coach filtering API
  - [x] 10.1 Create getClubCoaches query in tRPC router
    - Filter coaches by clubId matching the requesting student
    - Return coach profile information for selection UI
    - Handle default club filtering for students without club affiliation
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.2 Add validation for coach filtering
    - Validate clubId parameter
    - Ensure only coaches are returned (filter by user type)
    - Handle edge cases for missing club data
    - _Requirements: 9.1, 9.2_

  - [x] 10.3 Write property test for same-club coach filtering
    - **Property 9: Same-club coach filtering**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 10.4 Write property test for default club coach display
    - **Property 15: Default club coach display**
    - **Validates: Requirements 9.3**

  - [ ]* 10.5 Write unit tests for coach filtering
    - Test filtering with various club configurations
    - Test default club behavior
    - Test empty results handling
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 11. Implement coach assignment API
  - [x] 11.1 Create assignCoach mutation in video collection router
    - Accept collectionId and coachId parameters
    - Validate coach belongs to same club as student
    - Persist coach assignment to database
    - Support null coachId to remove assignment
    - _Requirements: 9.5, 12.2_

  - [x] 11.2 Add validation for coach assignments
    - Verify coach exists and is a coach user type
    - Verify coach and student are in same club
    - Verify requesting user owns the collection
    - _Requirements: 9.1, 10.1_

  - [x]* 11.3 Write property test for coach assignment persistence
    - **Property 13: Coach assignment persistence**
    - **Validates: Requirements 12.2, 12.5**

  - [x]* 11.4 Write property test for multiple coach assignments
    - **Property 14: Multiple coach assignments**
    - **Validates: Requirements 11.4**

  - [x]* 11.5 Write unit tests for coach assignment
    - Test successful assignment
    - Test assignment removal
    - Test validation errors for cross-club assignments
    - _Requirements: 9.5, 11.3_

- [x] 12. Implement access control for media collections
  - [x] 12.1 Create access control middleware
    - Check if user is collection owner
    - Check if user is assigned coach
    - Return appropriate authorization errors
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 12.2 Update getVideoCollection query with access control
    - Apply access control middleware
    - Include assigned coach information in response
    - Handle unauthorized access gracefully
    - _Requirements: 10.2, 12.5_

  - [x] 12.3 Update video collection queries to filter by access
    - Filter collections for coaches to show only assigned ones
    - Show all collections for student owners
    - _Requirements: 10.1, 10.4_

  - [x]* 12.4 Write property test for coach assignment access control
    - **Property 10: Coach assignment access control**
    - **Validates: Requirements 10.1, 10.2**

  - [x]* 12.5 Write property test for unassigned collection access
    - **Property 11: Unassigned collection access**
    - **Validates: Requirements 10.3**

  - [x]* 12.6 Write property test for access permission updates
    - **Property 12: Access permission updates**
    - **Validates: Requirements 10.5, 11.3**

  - [x]* 12.7 Write unit tests for access control
    - Test owner access
    - Test assigned coach access
    - Test unauthorized coach access denial
    - Test access after assignment changes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create coach selection UI component
  - [x] 14.1 Create CoachSelector component
    - Display list of available coaches from student's club
    - Show coach names and profile information
    - Handle coach selection and assignment
    - Support removing coach assignment
    - _Requirements: 9.4, 11.2, 11.5_

  - [x] 14.2 Integrate CoachSelector with media collection pages
    - Add coach selector to collection detail page
    - Display currently assigned coach
    - Show coach selector only to collection owners
    - _Requirements: 11.1, 11.2_

  - [x]* 14.3 Write unit tests for CoachSelector component
    - Test coach list rendering
    - Test coach selection interaction
    - Test assignment removal
    - _Requirements: 9.4, 11.2, 11.5_

- [ ] 15. Update media collection display components
  - [x] 15.1 Add assigned coach display to collection view
    - Show assigned coach name and profile link
    - Display "No coach assigned" when appropriate
    - Format consistently with other UI components
    - _Requirements: 11.1_

  - [x] 15.2 Update collection list to show coach assignments and implement coach filtering
    - Display assigned coach in collection cards on the video collections listing page
    - Update the video collections page to include assignedCoach data in queries
    - Implement filtering for coach users to only show collections assigned to them
    - Show assigned coach information in collection cards for better organization
    - _Requirements: 10.1, 10.4, 11.1_

  - [ ]* 15.3 Write unit tests for collection display updates
    - Test assigned coach display
    - Test unassigned state display
    - Test collection filtering for coaches
    - _Requirements: 11.1_

- [ ] 16. Implement error handling for access control
  - [x] 16.1 Add error pages for unauthorized access
    - Create 403 error page for media collections
    - Display helpful message explaining access restrictions
    - Provide navigation back to accessible content
    - _Requirements: 10.4_

  - [x] 16.2 Add error handling for coach assignment failures
    - Display validation errors for invalid assignments
    - Show helpful messages for cross-club assignment attempts
    - Handle network errors gracefully
    - _Requirements: 9.1_

  - [ ]* 16.3 Write unit tests for error handling
    - Test unauthorized access error display
    - Test assignment error messages
    - Test network error handling
    - _Requirements: 10.4_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.