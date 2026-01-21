# Requirements Document

## Introduction

The Coach Media Collections feature extends the ShuttleMentor platform to allow coaches to create and share instructional video collections with students in their club. This feature enables coaches to build libraries of technique demonstrations, training exercises, and educational content that can be shared with multiple students simultaneously, enhancing the coaching experience beyond individual feedback sessions.

## Glossary

- **System**: The ShuttleMentor web application
- **Coach**: A User with coach privileges who provides coaching services
- **Student**: A User with student privileges who seeks coaching
- **Admin**: A User with administrative privileges who manages the platform
- **Facility**: A User with facility management privileges who oversees club operations and coach activities
- **Coach Media Collection**: A grouped set of instructional videos created by a Coach
- **Coach Media**: Individual video files or URLs within a Coach Media Collection
- **Club**: An organizational unit that groups Users within the same badminton facility or organization
- **Sharing**: The process of granting Students access to Coach Media Collections
- **Collection Access**: Permission system controlling which Students can view specific Coach Media Collections
- **Instructional Content**: Educational videos created by Coaches for teaching purposes
- **Multi-Student Sharing**: The ability to share a single Coach Media Collection with multiple Students simultaneously
- **All Students Sharing**: The ability to share a collection with all Students in the same club automatically
- **Specific Student Sharing**: The ability to share a collection with individually selected Students from the same club
- **Facility Access**: The read-only access granted to Facility Users to view all coach collections within their club

## Requirements

### Requirement 1: Coach Media Collection Creation

**User Story:** As a coach, I want to create collections of instructional videos, so that I can organize my teaching content and share it with students.

#### Acceptance Criteria

1. WHEN a Coach creates a Coach Media Collection THEN the System SHALL require a title and allow optional description and mediaType
2. WHEN a Coach creates a Coach Media Collection THEN the System SHALL link it to their User record via coachId
3. THE System SHALL support URL_VIDEO media type for Coach Media Collections
4. WHEN a Coach attempts to create a Coach Media Collection THEN the System SHALL verify the user has COACH or ADMIN userType
5. WHEN a Student or Facility attempts to create a Coach Media Collection THEN the System SHALL deny the operation with appropriate error message

### Requirement 2: Coach Media Management

**User Story:** As a coach, I want to add individual instructional videos to my collections, so that I can build comprehensive teaching libraries.

#### Acceptance Criteria

1. WHEN a Coach adds Coach Media to a collection THEN the System SHALL require a title, collectionId, and videoUrl
2. WHEN a Coach adds URL-based Coach Media THEN the System SHALL validate the videoUrl format
3. WHEN a Coach Media Collection has mediaType URL_VIDEO THEN the System SHALL enforce a maximum of 3 videos per collection
4. WHEN a Coach updates Coach Media THEN the System SHALL allow modification of title, description, videoUrl, and thumbnailUrl
5. WHEN Coach Media is deleted THEN the System SHALL set isDeleted to true and record deletedAt timestamp

### Requirement 3: Club-Based Student Access

**User Story:** As a coach, I want to share my media collections with students from my club, so that I can provide targeted instruction to my club members.

#### Acceptance Criteria

1. WHEN a Coach shares a collection THEN the System SHALL only allow sharing with Students who have the same clubId as the Coach
2. WHEN a Coach attempts to share with a Student from a different club THEN the System SHALL reject the operation with appropriate error message
3. WHEN retrieving Students for sharing THEN the System SHALL display only Students with matching clubId and STUDENT userType
4. WHEN displaying Students for sharing THEN the System SHALL show firstName, lastName, email, and displayUsername if available
5. THE System SHALL validate that all target Students exist and are active before creating share relationships

### Requirement 4: Multi-Student Collection Sharing

**User Story:** As a coach, I want to share a single collection with multiple students simultaneously, so that I can efficiently distribute instructional content to my entire coaching group.

#### Acceptance Criteria

1. WHEN a Coach shares a collection THEN the System SHALL accept an array of Student userIds or an "All Students" option
2. WHEN creating share relationships THEN the System SHALL create individual CoachCollectionShare records for each Student
3. WHEN a Coach selects "All Students" sharing THEN the System SHALL create share records for all Students in the same club
4. WHEN a Coach attempts to share with a Student who already has access THEN the System SHALL skip duplicate creation without error
5. WHEN a Coach removes sharing THEN the System SHALL delete the corresponding CoachCollectionShare records
6. THE System SHALL record the sharedAt timestamp when creating new share relationships

### Requirement 5: Coach Collection Management Dashboard

**User Story:** As a coach, I want to view and manage all my created collections, so that I can organize my instructional content and track sharing status.

#### Acceptance Criteria

1. WHEN a Coach views their collections dashboard THEN the System SHALL display all Coach Media Collections where coachId matches the Coach userId
2. WHEN displaying Coach collections THEN the System SHALL show title, description, creation date, media count, and shared student count
3. WHEN a Coach views collection details THEN the System SHALL display all Coach Media items and list of Students with access
4. WHEN displaying collections THEN the System SHALL exclude collections where isDeleted is true
5. WHEN a Coach deletes a collection THEN the System SHALL soft-delete the collection and remove all associated share relationships

### Requirement 6: Student Access to Shared Collections

**User Story:** As a student, I want to view instructional collections shared with me by coaches, so that I can access additional learning materials beyond individual feedback.

#### Acceptance Criteria

1. WHEN a Student views shared collections THEN the System SHALL display all Coach Media Collections shared with their userId
2. WHEN displaying shared collections THEN the System SHALL show collection title, description, Coach name, share date, and media count
3. WHEN a Student accesses a shared collection THEN the System SHALL display all Coach Media items with titles, descriptions, and video content
4. WHEN a collection is no longer shared with a Student THEN the System SHALL immediately remove it from the Student view
5. WHEN displaying shared collections THEN the System SHALL exclude collections where isDeleted is true

### Requirement 7: Collection Access Control

**User Story:** As a system administrator, I want proper access control for coach collections, so that only authorized users can view and modify instructional content.

#### Acceptance Criteria

1. WHEN a Coach accesses their own collection THEN the System SHALL allow full read and write access
2. WHEN a Student accesses a shared collection THEN the System SHALL allow read-only access to collection and media content
3. WHEN a User attempts to access a non-shared collection THEN the System SHALL deny access with appropriate error message
4. WHEN an Admin accesses any collection THEN the System SHALL allow full read and write access
5. THE System SHALL verify collection ownership or sharing relationship before granting access to collection details

### Requirement 8: Coach Media Collection Soft Deletion

**User Story:** As a system administrator, I want deleted coach collections to be marked rather than removed, so that instructional content can be recovered if needed.

#### Acceptance Criteria

1. WHEN a Coach Media Collection is deleted THEN the System SHALL set isDeleted to true and record deletedAt timestamp
2. WHEN a Coach Media Collection is soft-deleted THEN the System SHALL remove all associated CoachCollectionShare records
3. WHEN Coach Media is deleted THEN the System SHALL set isDeleted to true and record deletedAt timestamp
4. WHEN querying Coach Media Collections THEN the System SHALL exclude records where isDeleted is true by default
5. WHEN an Admin restores a soft-deleted collection THEN the System SHALL set isDeleted to false and clear deletedAt timestamp

### Requirement 9: Collection Sharing Management

**User Story:** As a coach, I want to easily manage which students have access to my collections, so that I can control the distribution of my instructional content.

#### Acceptance Criteria

1. WHEN a Coach views collection sharing THEN the System SHALL display all Students currently with access to the collection
2. WHEN a Coach adds Students to sharing THEN the System SHALL create new CoachCollectionShare records with current timestamp
3. WHEN a Coach removes Students from sharing THEN the System SHALL delete the corresponding CoachCollectionShare records
4. WHEN managing sharing THEN the System SHALL provide bulk operations for adding or removing multiple Students simultaneously
5. THE System SHALL prevent sharing with Users who are not Students or not from the same club

### Requirement 10: Student Collection Discovery

**User Story:** As a student, I want to easily discover and access instructional collections shared with me, so that I can supplement my learning with coach-provided materials.

#### Acceptance Criteria

1. WHEN a Student logs in THEN the System SHALL display a count of newly shared collections since their last login
2. WHEN a Student views their dashboard THEN the System SHALL show recently shared collections with Coach names and share dates
3. WHEN a Student searches shared collections THEN the System SHALL allow filtering by Coach name or collection title
4. WHEN displaying shared collections THEN the System SHALL show collection thumbnails using the first media item if available
5. THE System SHALL organize shared collections by share date with most recent first

### Requirement 11: Coach Media URL Validation

**User Story:** As a coach, I want the system to validate video URLs when I add media, so that students can reliably access the instructional content.

#### Acceptance Criteria

1. WHEN a Coach enters a video URL THEN the System SHALL validate the URL format using standard URL validation
2. WHEN a Coach submits invalid URL format THEN the System SHALL display appropriate error message and prevent submission
3. WHEN a Coach updates media URL THEN the System SHALL re-validate the new URL format
4. THE System SHALL accept common video hosting platforms including direct video file URLs
5. WHEN storing video URLs THEN the System SHALL preserve the original URL format without modification

### Requirement 12: Collection Analytics and Metrics

**User Story:** As a coach, I want to see basic analytics about my shared collections, so that I can understand how my instructional content is being used.

#### Acceptance Criteria

1. WHEN a Coach views collection details THEN the System SHALL display the total number of Students with access
2. WHEN a Coach views their collections dashboard THEN the System SHALL show total collections created and total Students reached
3. WHEN displaying collection metrics THEN the System SHALL show creation date and last modification date
4. WHEN a collection is shared or unshared THEN the System SHALL update the sharing metrics immediately
5. THE System SHALL provide summary statistics including most shared collection and total instructional videos created

### Requirement 13: Database Schema for Coach Collections

**User Story:** As a system administrator, I want proper database schema for coach collections, so that data integrity is maintained and queries are performant.

#### Acceptance Criteria

1. THE System SHALL create CoachMediaCollection model with collectionId, coachId, title, description, mediaType, sharingType, isDeleted, deletedAt, createdAt, and updatedAt fields
2. THE System SHALL create CoachMedia model with mediaId, collectionId, title, description, videoUrl, thumbnailUrl, isDeleted, deletedAt, createdAt, and updatedAt fields
3. THE System SHALL create CoachCollectionShare model with shareId, collectionId, studentId, and sharedAt fields
4. THE System SHALL support sharingType enum with values: SPECIFIC_STUDENTS and ALL_STUDENTS
5. THE System SHALL enforce foreign key relationships with appropriate cascade behaviors
6. THE System SHALL create database indexes on coachId, collectionId, studentId, sharingType, and isDeleted fields for query performance
7. THE System SHALL enforce unique constraint on CoachCollectionShare (collectionId, studentId) to prevent duplicate shares

### Requirement 14: Integration with Existing Platform

**User Story:** As a user, I want coach collections to integrate seamlessly with the existing platform, so that the experience feels cohesive and familiar.

#### Acceptance Criteria

1. WHEN a Coach navigates to collections THEN the System SHALL provide clear distinction between student collections and coach collections
2. WHEN a Student views their dashboard THEN the System SHALL display both personal collections and shared coach collections in appropriate sections
3. WHEN using coach collections THEN the System SHALL maintain consistent UI patterns with existing video collection features
4. THE System SHALL reuse existing components for video display, form inputs, and navigation where appropriate
5. WHEN errors occur in coach collections THEN the System SHALL display error messages consistent with existing platform patterns

### Requirement 15: Enhanced Collection Sharing Options

**User Story:** As a coach, I want to share my media collections with all students in my club or with specific selected students, so that I can efficiently distribute instructional content based on my teaching needs.

#### Acceptance Criteria

1. WHEN a Coach shares a collection THEN the System SHALL provide options to share with "All Students" or "Specific Students"
2. WHEN a Coach selects "All Students" THEN the System SHALL automatically share the collection with all Students in the same club
3. WHEN a Coach selects "Specific Students" THEN the System SHALL allow selection of individual Students from the same club
4. WHEN new Students join the club THEN the System SHALL automatically grant access to collections shared with "All Students"
5. WHEN a Coach changes sharing from "Specific Students" to "All Students" THEN the System SHALL grant access to all remaining Students in the club

### Requirement 16: Facility User Access to Coach Collections

**User Story:** As a facility manager, I want to view all media collections created by coaches in my club, so that I can monitor the instructional content being shared and ensure quality standards.

#### Acceptance Criteria

1. WHEN a Facility User views coach collections THEN the System SHALL display all Coach Media Collections from coaches with the same clubId
2. WHEN a Facility User accesses a coach collection THEN the System SHALL allow read-only access to collection details and media content
3. WHEN displaying coach collections to Facility Users THEN the System SHALL show collection title, description, coach name, creation date, and sharing status
4. WHEN a Facility User views collection details THEN the System SHALL display all Coach Media items and list of Students with access
5. THE System SHALL exclude soft-deleted collections from Facility User views

### Requirement 17: Coach Collection Permissions Validation

**User Story:** As a system administrator, I want comprehensive permission validation for coach collections, so that security is maintained throughout the feature.

#### Acceptance Criteria

1. WHEN any coach collection operation occurs THEN the System SHALL verify the requesting user is authenticated
2. WHEN a Coach creates or modifies collections THEN the System SHALL verify the user has COACH or ADMIN userType
3. WHEN sharing operations occur THEN the System SHALL verify all target Students belong to the same club as the Coach
4. WHEN Students access shared content THEN the System SHALL verify active sharing relationship exists
5. WHEN Facility Users access coach collections THEN the System SHALL verify the coaches belong to the same club as the Facility User
6. THE System SHALL log access attempts and permission violations for security monitoring