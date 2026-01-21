# Implementation Plan

## Overview
This implementation plan converts the coach media collections design into a series of incremental development tasks. Each task builds on previous work and focuses on delivering working functionality that can be tested and validated. The feature now supports both coaches and facility managers creating and sharing collections with students and coaches.

- [x] 1. Database Schema and Models Setup
  - Create new Prisma models for CoachMediaCollection, CoachMedia, and CoachCollectionShare
  - Add SharingType enum with SPECIFIC_USERS, ALL_STUDENTS, and ALL_COACHES values
  - Update CoachCollectionShare model to use sharedWithId instead of studentId to support sharing with any user type
  - Update User model with new relations for coach collections and shared collections
  - Generate and run database migration
  - Update Prisma client types
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 1.1 Write property test for database schema constraints
  - **Property 5: Share Relationship Uniqueness**
  - **Validates: Requirements 4.5, 13.7**

- [x] 2. Server Utils and Helper Functions
  - Add isCoachFacilityOrAdmin helper function to server utils
  - Add isCoachOrFacility helper function to server utils
  - Add club validation utilities for sharing operations with students and coaches
  - Update existing helper functions to support coach and facility collections
  - _Requirements: 17.2, 3.1, 3.2, 1.4_

- [x] 2.1 Write property test for permission helpers
  - **Property 7: Creator Permission Validation**
  - **Validates: Requirements 1.4, 17.2**

- [x] 3. Coach Media Collection API Router
  - Create coachMediaCollection tRPC router with all CRUD operations
  - Implement create, getAll, getById, update, delete endpoints
  - Add input validation schemas using Zod
  - Implement proper error handling and permission checks
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 7.1, 7.3, 8.1, 8.2_

- [x] 3.1 Write property test for collection ownership
  - **Property 2: Collection Ownership Validation**
  - **Validates: Requirements 7.1, 7.3**

- [x] 4. Coach Media Management API
  - Implement addMedia, updateMedia, deleteMedia endpoints in router
  - Add URL validation for video links
  - Enforce 3-video limit for URL collections
  - Implement soft deletion for coach media
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 4.1 Write property test for video limit enforcement
  - **Property 6: URL Video Limit Enforcement**
  - **Validates: Requirements 2.3**

- [x] 5. Enhanced Collection Sharing API
  - Implement shareWithUsers and unshareFromUsers endpoints with sharing type support
  - Add support for "All Students", "All Coaches", and "Specific Users" sharing modes
  - Add getClubUsers endpoint for student and coach selection
  - Implement club-based access control for sharing with students and coaches
  - Add bulk sharing operations support
  - Implement automatic sharing for new students joining clubs with "All Students" collections
  - Implement automatic sharing for new coaches joining clubs with "All Coaches" collections
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 9.2, 9.3, 9.4, 9.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 18.1, 18.2, 18.4_

- [x] 5.1 Write property test for club isolation
  - **Property 1: Club Isolation Enforcement**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 5.2 Write property test for club user filtering
  - **Property 8: Club User Filtering**
  - **Validates: Requirements 3.3, 3.4**

- [ ]* 5.3 Write property test for sharing type enforcement
  - **Property 9: Sharing Type Enforcement**
  - **Validates: Requirements 15.2, 15.5**

- [ ]* 5.4 Write property test for coach assignment
  - **Property 11: Coach Assignment Validation**
  - **Validates: Requirements 18.1, 18.4**

- [x] 6. Facility User Access and Creation API
  - Implement facility collection creation with same capabilities as coaches
  - Implement getFacilityCollections endpoint for facility users to view all club collections
  - Add full read-write access control for facility users to their own collections
  - Add read-only access for facility users to coach-created collections in their club
  - Implement club-based filtering for facility access
  - Add facility user permission validation for creation and sharing
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 17.2, 17.5_

- [ ]* 6.1 Write property test for facility access control
  - **Property 10: Facility Access Control**
  - **Validates: Requirements 16.5, 7.5**

- [x] 7. User Access API for Shared Collections
  - Implement getSharedWithMe endpoint for students and coaches
  - Add access control validation for shared collections
  - Implement read-only access for students and coaches to shared collections
  - Support displaying collections shared by both coaches and facility managers
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.4, 18.3_

- [ ]* 7.1 Write property test for user access control
  - **Property 3: User Access Control**
  - **Validates: Requirements 6.4, 7.2, 7.5**

- [x] 8. Add Router to API Root
  - Import coachMediaCollection router in server API root
  - Export router in appRouter configuration
  - Verify tRPC type generation includes new endpoints
  - _Requirements: 14.3, 14.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Enhanced Coach Media Collection Form Component
  - Create CoachMediaCollectionForm component based on existing VideoCollectionForm
  - Add sharing type selection (All Students, All Coaches, or Specific Users)
  - Add user selection interface for specific sharing (students and/or coaches)
  - Implement form validation and error handling
  - Add coach and facility permission checks and redirects
  - Support facility users creating collections
  - _Requirements: 1.1, 1.4, 1.5, 15.1, 15.2, 15.3, 15.4, 16.1, 14.1, 14.3, 14.4, 14.5_

- [ ]* 10.1 Write unit tests for Enhanced CoachMediaCollectionForm
  - Test sharing type selection functionality (All Students, All Coaches, Specific Users)
  - Test form validation and submission
  - Test user selection functionality for students and coaches
  - Test permission checks and error states for coaches and facility users
  - _Requirements: 1.1, 1.4, 1.5, 15.1, 15.2, 15.3, 15.4, 16.1_

- [x] 11. Enhanced User Selector Component
  - Create multi-select component for choosing students and coaches to share with
  - Add "All Students", "All Coaches", and "Specific Users" toggle options
  - Implement club-based user filtering for both students and coaches
  - Add search and bulk selection functionality
  - Display user type badges (Student/Coach) in selection interface
  - Style component consistent with existing UI patterns
  - _Requirements: 3.3, 3.4, 9.1, 9.4, 15.1, 15.2, 15.3, 15.4, 18.2, 14.4_

- [x] 11.1 Write unit tests for Enhanced UserSelector
  - Test sharing type toggle functionality (All Students, All Coaches, Specific Users)
  - Test user filtering and selection for students and coaches
  - Test search functionality
  - Test bulk operations
  - Test user type badge display
  - _Requirements: 3.3, 3.4, 9.4, 15.1, 15.2, 15.3, 15.4, 18.2_

- [x] 12. Facility Collection Management Dashboard
  - Create dashboard component for facility users to create and manage collections
  - Display collections created by facility user and all coach collections in the same club
  - Show collection details, creator information, and sharing status
  - Implement full creation and management capabilities for facility-owned collections
  - Implement read-only access for coach-created collections
  - Add sharing interface for students and coaches
  - Display analytics on content distribution across the club
  - Integrate with existing facility dashboard layout
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 18.1, 18.2, 14.4_

- [ ]* 12.1 Write unit tests for Facility Collection Management Dashboard
  - Test collection display from facility and coaches
  - Test creation and management capabilities for facility collections
  - Test read-only access enforcement for coach collections
  - Test club-based filtering
  - Test sharing interface for students and coaches
  - Test integration with facility dashboard
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 18.1, 18.2_

- [x] 13. Coach Collection Dashboard
  - Create dashboard component for coaches to manage their collections
  - Display collection list with metadata and sharing status
  - Add collection management actions (edit, delete, share)
  - Show sharing type (All Students, All Coaches, or Specific Users) in collection list
  - Display collections shared with coach by facility managers
  - Integrate with existing coach dashboard layout
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2, 12.3, 12.4, 12.5, 15.1, 15.2, 15.3, 18.3, 14.1, 14.4_

- [ ]* 13.1 Write unit tests for CoachCollectionDashboard
  - Test collection display and filtering
  - Test management actions
  - Test sharing status and type display (All Students, All Coaches, Specific Users)
  - Test display of facility-shared collections
  - _Requirements: 5.1, 5.2, 5.3, 12.1, 12.2, 15.1, 15.2, 15.3, 18.3_

- [x] 14. Shared Collections List Component
  - Create component for students and coaches to view shared collections
  - Display creator information (coach or facility) and share dates
  - Implement collection access and content viewing
  - Add to student and coach dashboard integration
  - Show creator type badge (Coach/Facility Manager)
  - _Requirements: 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.4, 10.5, 18.3, 18.5, 14.2, 14.4_

- [ ]* 14.1 Write unit tests for SharedCollectionsList
  - Test collection display and access for students and coaches
  - Test creator information display (coach vs facility)
  - Test creator type badge display
  - Test integration with student and coach dashboards
  - _Requirements: 6.1, 6.2, 6.3, 10.1, 10.2, 18.3, 18.5_

- [x] 15. Collection Detail View Component
  - Create detailed view component for coach and facility collections
  - Display all media items with video players
  - Show sharing information and management controls
  - Implement access control based on user role (Coach, Facility, Student, Admin)
  - Add facility user full access to their own collections
  - Add facility user read-only view for coach collections
  - Show creator information and type
  - _Requirements: 5.3, 6.3, 7.1, 7.2, 7.4, 7.5, 16.2, 16.4, 16.5, 14.4_

- [ ]* 15.1 Write unit tests for Collection Detail View
  - Test media display and video playback
  - Test access control for different user roles including facility
  - Test sharing management interface
  - Test facility full access to own collections
  - Test facility read-only access to coach collections
  - _Requirements: 5.3, 6.3, 7.1, 7.2, 7.5, 16.2, 16.4, 16.5_

- [x] 16. Navigation and Routing Updates
  - Add routes for coach and facility collection creation and management
  - Add routes for facility user collection viewing and creation
  - Update navigation menus to include collection links for coaches and facility users
  - Add route guards for coach-only, facility-only, and shared access pages
  - Ensure consistent URL patterns with existing features
  - _Requirements: 14.1, 14.2, 14.3, 16.1, 17.1, 17.2, 17.5_

- [ ]* 16.1 Write unit tests for routing and navigation
  - Test route guards and permissions for all user types
  - Test navigation menu updates
  - Test URL pattern consistency
  - _Requirements: 14.1, 14.2, 16.1, 17.1, 17.2_

- [x] 17. Dashboard Integration
  - Update coach dashboard to show coach collection metrics and facility-shared collections
  - Update student dashboard to show shared collections from coaches and facility
  - Update facility dashboard to show collection creation and management options
  - Add quick access links and summary statistics
  - Maintain existing dashboard functionality
  - _Requirements: 12.1, 12.2, 12.5, 10.1, 10.2, 16.1, 16.3, 18.3, 14.2, 14.4_

- [ ]* 17.1 Write unit tests for dashboard integration
  - Test coach metrics display and facility-shared collections
  - Test student shared collections display from coaches and facility
  - Test facility collection creation and management interface
  - Test dashboard functionality preservation
  - _Requirements: 12.1, 12.2, 10.1, 10.2, 16.1, 16.3, 18.3, 14.2_

- [x] 18. Error Handling and User Feedback
  - Implement comprehensive error handling for all coach collection operations
  - Add user-friendly error messages and recovery options
  - Implement loading states and success notifications
  - Ensure consistent error patterns with existing platform
  - _Requirements: 14.5, 17.4, 17.6_

- [ ]* 18.1 Write unit tests for error handling
  - Test error message display and recovery
  - Test loading states and notifications
  - Test error pattern consistency
  - _Requirements: 14.5, 17.4, 17.6_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Integration Testing and Polish
  - Test complete workflows from collection creation to student and coach access
  - Test facility user creation and sharing with students and coaches
  - Verify permission enforcement across all user roles
  - Test sharing operations with multiple users and all sharing types
  - Test coach assignment workflows from facility managers
  - Polish UI/UX for consistency with existing platform
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 17.1, 17.2, 17.3, 17.4, 17.5, 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 20.1 Write integration tests for complete workflows
  - Test end-to-end collection creation and sharing by coaches and facility
  - Test cross-role access and permissions including facility users
  - Test bulk sharing operations and all sharing type changes
  - Test coach assignment workflows
  - _Requirements: 14.1, 14.2, 15.1, 15.2, 15.3, 15.4, 15.6, 15.7, 16.1, 16.2, 17.1, 17.2, 17.3, 18.1, 18.2, 18.4_

- [ ] 21. Performance Optimization
  - Optimize database queries for club-based operations
  - Implement efficient pagination for large student lists
  - Add caching for frequently accessed collections
  - Monitor and optimize component rendering performance
  - _Requirements: 13.5_

- [ ]* 21.1 Write performance tests
  - Test query performance with large datasets
  - Test pagination efficiency
  - Test caching effectiveness
  - _Requirements: 13.5_

- [ ] 22. Final Checkpoint - Complete Feature Validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented and working
  - Conduct final user acceptance testing
  - Document any remaining issues or future enhancements