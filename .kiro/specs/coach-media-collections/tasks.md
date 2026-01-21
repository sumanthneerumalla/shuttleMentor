# Implementation Plan

## Overview
This implementation plan converts the coach media collections design into a series of incremental development tasks. Each task builds on previous work and focuses on delivering working functionality that can be tested and validated.

- [x] 1. Database Schema and Models Setup
  - Create new Prisma models for CoachMediaCollection, CoachMedia, and CoachCollectionShare
  - Add SharingType enum with SPECIFIC_STUDENTS and ALL_STUDENTS values
  - Update User model with new relations for coach collections and shared collections
  - Generate and run database migration
  - Update Prisma client types
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 1.1 Write property test for database schema constraints
  - **Property 5: Share Relationship Uniqueness**
  - **Validates: Requirements 4.3, 13.6**

- [x] 2. Server Utils and Helper Functions
  - Add isCoachOrAdmin helper function to server utils
  - Add isCoach helper function to server utils
  - Add club validation utilities for sharing operations
  - Update existing helper functions to support coach collections
  - _Requirements: 15.2, 3.1, 3.2, 1.4, 17.2_

- [x] 2.1 Write property test for permission helpers
  - **Property 7: Coach Permission Validation**
  - **Validates: Requirements 1.4, 15.2**

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
  - Implement shareWithStudents and unshareFromStudents endpoints with sharing type support
  - Add support for "All Students" and "Specific Students" sharing modes
  - Add getClubStudents endpoint for student selection
  - Implement club-based access control for sharing
  - Add bulk sharing operations support
  - Implement automatic sharing for new students joining clubs with "All Students" collections
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2, 9.3, 9.4, 9.5, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 5.1 Write property test for club isolation
  - **Property 1: Club Isolation Enforcement**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 5.2 Write property test for club student filtering
  - **Property 8: Club Student Filtering**
  - **Validates: Requirements 3.3, 3.4**

- [ ]* 5.3 Write property test for sharing type enforcement
  - **Property 9: Sharing Type Enforcement**
  - **Validates: Requirements 15.1, 15.2, 15.3**

- [x] 6. Facility User Access API
  - Implement getFacilityCoachCollections endpoint for facility users
  - Add read-only access control for facility users to coach collections
  - Implement club-based filtering for facility access
  - Add facility user permission validation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.5_

- [ ]* 6.1 Write property test for facility access control
  - **Property 10: Facility Access Control**
  - **Validates: Requirements 16.1, 16.2, 17.5**

- [x] 7. Student Access API
  - Implement getSharedWithMe endpoint for students
  - Add access control validation for shared collections
  - Implement read-only access for students to coach collections
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.4_

- [ ]* 7.1 Write property test for student access control
  - **Property 3: Student Access Control**
  - **Validates: Requirements 6.4, 7.2**

- [x] 8. Add Router to API Root
  - Import coachMediaCollection router in server API root
  - Export router in appRouter configuration
  - Verify tRPC type generation includes new endpoints
  - _Requirements: 14.3, 14.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Enhanced Coach Media Collection Form Component
  - Create CoachMediaCollectionForm component based on existing VideoCollectionForm
  - Add sharing type selection (All Students vs Specific Students)
  - Add student selection interface for specific sharing
  - Implement form validation and error handling
  - Add coach permission checks and redirects
  - _Requirements: 1.1, 1.4, 1.5, 15.1, 15.2, 15.3, 14.1, 14.3, 14.4, 14.5_

- [ ]* 10.1 Write unit tests for Enhanced CoachMediaCollectionForm
  - Test sharing type selection functionality
  - Test form validation and submission
  - Test student selection functionality
  - Test permission checks and error states
  - _Requirements: 1.1, 1.4, 1.5, 15.1, 15.2, 15.3_

- [x] 11. Enhanced Student Selector Component
  - Create multi-select component for choosing students to share with
  - Add "All Students" vs "Specific Students" toggle
  - Implement club-based student filtering
  - Add search and bulk selection functionality
  - Style component consistent with existing UI patterns
  - _Requirements: 3.3, 3.4, 9.1, 9.4, 15.1, 15.2, 15.3, 14.4_

- [ ]* 11.1 Write unit tests for Enhanced StudentSelector
  - Test sharing type toggle functionality
  - Test student filtering and selection
  - Test search functionality
  - Test bulk operations
  - _Requirements: 3.3, 3.4, 9.4, 15.1, 15.2, 15.3_

- [x] 12. Facility Coach Collections Dashboard
  - Create dashboard component for facility users to view all coach collections
  - Display collections from all coaches in the same club
  - Show coach information, collection details, and sharing status
  - Implement read-only access with no modification capabilities
  - Integrate with existing facility dashboard layout
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 14.4_

- [ ]* 12.1 Write unit tests for Facility Coach Collections Dashboard
  - Test collection display from multiple coaches
  - Test read-only access enforcement
  - Test club-based filtering
  - Test integration with facility dashboard
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 13. Coach Collection Dashboard
  - Create dashboard component for coaches to manage their collections
  - Display collection list with metadata and sharing status
  - Add collection management actions (edit, delete, share)
  - Show sharing type (All Students vs Specific Students) in collection list
  - Integrate with existing coach dashboard layout
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2, 12.3, 12.4, 12.5, 15.1, 15.2, 14.1, 14.4_

- [ ]* 13.1 Write unit tests for CoachCollectionDashboard
  - Test collection display and filtering
  - Test management actions
  - Test sharing status and type display
  - _Requirements: 5.1, 5.2, 5.3, 12.1, 12.2, 15.1, 15.2_

- [x] 14. Shared Collections List Component
  - Create component for students to view shared collections
  - Display coach information and share dates
  - Implement collection access and content viewing
  - Add to student dashboard integration
  - _Requirements: 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.4, 10.5, 14.2, 14.4_

- [ ]* 14.1 Write unit tests for SharedCollectionsList
  - Test collection display and access
  - Test coach information display
  - Test integration with student dashboard
  - _Requirements: 6.1, 6.2, 6.3, 10.1, 10.2_

- [x] 15. Collection Detail View Component
  - Create detailed view component for coach collections
  - Display all media items with video players
  - Show sharing information and management controls
  - Implement access control based on user role (Coach, Student, Facility)
  - Add facility user read-only view
  - _Requirements: 5.3, 6.3, 7.1, 7.2, 7.4, 16.2, 16.4, 14.4_

- [ ]* 15.1 Write unit tests for Collection Detail View
  - Test media display and video playback
  - Test access control for different user roles including facility
  - Test sharing management interface
  - _Requirements: 5.3, 6.3, 7.1, 7.2, 16.2, 16.4_

- [x] 16. Navigation and Routing Updates
  - Add routes for coach collection creation and management
  - Add routes for facility user coach collection viewing
  - Update navigation menus to include coach collection links for coaches and facility users
  - Add route guards for coach-only and facility access pages
  - Ensure consistent URL patterns with existing features
  - _Requirements: 14.1, 14.2, 14.3, 16.1, 17.1, 17.2, 17.5_

- [ ]* 16.1 Write unit tests for routing and navigation
  - Test route guards and permissions for all user types
  - Test navigation menu updates
  - Test URL pattern consistency
  - _Requirements: 14.1, 14.2, 16.1, 17.1, 17.2_

- [x] 17. Dashboard Integration
  - Update coach dashboard to show coach collection metrics
  - Update student dashboard to show shared collections
  - Update facility dashboard to show coach collection overview
  - Add quick access links and summary statistics
  - Maintain existing dashboard functionality
  - _Requirements: 12.1, 12.2, 12.5, 10.1, 10.2, 16.1, 16.3, 14.2, 14.4_

- [ ]* 17.1 Write unit tests for dashboard integration
  - Test coach metrics display
  - Test student shared collections display
  - Test facility coach collections overview
  - Test dashboard functionality preservation
  - _Requirements: 12.1, 12.2, 10.1, 10.2, 16.1, 16.3, 14.2_

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
  - Test complete workflows from collection creation to student access
  - Test facility user access to coach collections
  - Verify permission enforcement across all user roles
  - Test sharing operations with multiple students and sharing types
  - Polish UI/UX for consistency with existing platform
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ]* 20.1 Write integration tests for complete workflows
  - Test end-to-end collection creation and sharing
  - Test cross-role access and permissions including facility users
  - Test bulk sharing operations and sharing type changes
  - _Requirements: 14.1, 14.2, 15.1, 15.2, 15.3, 16.1, 16.2, 17.1, 17.2, 17.3_

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