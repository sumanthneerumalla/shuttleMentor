# Requirements Document

## Introduction

ShuttleMentor is a web-based badminton coaching platform that connects students with qualified coaches for personalized training sessions. The system enables students to browse and book coaches, upload gameplay videos for review, and participate in virtual coaching sessions. Coaches can manage their profiles, set availability, review student videos, and conduct coaching sessions. The platform handles user authentication, profile management, video collections, session booking, and payment processing.

## Glossary

- **System**: The ShuttleMentor web application
- **User**: Any authenticated person using the platform
- **Student**: A User with student privileges who seeks coaching
- **Coach**: A User with coach privileges who provides coaching services
- **Admin**: A User with administrative privileges who manages the platform
- **Facility**: A User representing a physical badminton facility
- **Profile**: User-specific information including personal details and role-specific data
- **Video Collection**: A grouped set of gameplay videos uploaded by a Student
- **Media**: Individual video files or URLs within a Video Collection
- **Session**: A scheduled coaching appointment between a Student and Coach
- **Display Username**: A unique, URL-safe identifier for user profiles
- **Coaching Note**: Feedback text provided by a Coach on specific Student Media
- **MediaCoachNote**: A database model linking Media items with Coach feedback and timestamps
- **Clerk**: Third-party authentication service provider
- **tRPC**: Type-safe API layer for client-server communication
- **Prisma**: Database ORM for data access

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a user, I want to securely sign up and log in to the platform, so that I can access role-specific features and protect my personal information.

#### Acceptance Criteria

1. WHEN a user visits the platform THEN the System SHALL integrate with Clerk authentication service to handle user registration and login
2. WHEN a user successfully authenticates THEN the System SHALL create or retrieve a local User record linked to the Clerk user identifier
3. WHEN a user attempts to access protected routes without authentication THEN the System SHALL redirect the user to the sign-in page
4. WHEN a user has an assigned role THEN the System SHALL enforce role-based access control for all protected resources
5. THE System SHALL support four user types: STUDENT, COACH, ADMIN, and FACILITY

### Requirement 2: User Profile Management

**User Story:** As a user, I want to create and manage my profile information, so that other users can learn about me and I can customize my experience.

#### Acceptance Criteria

1. WHEN a user first authenticates THEN the System SHALL create a User record with default values for firstName, lastName, email, profileImage, userType, and timeZone
2. WHEN a user updates their profile THEN the System SHALL validate and persist changes to firstName, lastName, email, and timeZone fields
3. WHEN a user views their profile THEN the System SHALL display their userId, name, email, timeZone, userType, and account creation date
4. THE System SHALL store profile images as binary data with associated MIME type information
5. WHEN a user uploads a profile image THEN the System SHALL validate the image size does not exceed 5 megabytes

### Requirement 3: Student Profile Management

**User Story:** As a student, I want to create and manage my student-specific profile, so that coaches can understand my skill level and goals.

#### Acceptance Criteria

1. WHEN a Student creates their profile THEN the System SHALL allow entry of displayUsername, skillLevel, goals, bio, and profileImage
2. WHEN a Student sets a displayUsername THEN the System SHALL validate uniqueness across all Student profiles
3. WHEN a Student updates their profile THEN the System SHALL persist changes to the StudentProfile record
4. THE System SHALL link each StudentProfile to exactly one User record via userId
5. WHEN a StudentProfile is deleted THEN the System SHALL cascade delete the associated User record

### Requirement 4: Coach Profile Management

**User Story:** As a coach, I want to create and manage my coaching profile with detailed information, so that students can evaluate my qualifications and book sessions with me.

#### Acceptance Criteria

1. WHEN a Coach creates their profile THEN the System SHALL allow entry of displayUsername, bio, experience, specialties, teachingStyles, headerImage, profileImage, rate, and isVerified status
2. WHEN a Coach enters a bio THEN the System SHALL enforce a maximum length of 300 characters
3. WHEN a Coach enters experience details THEN the System SHALL enforce a maximum length of 1000 characters
4. WHEN a Coach sets a displayUsername THEN the System SHALL validate uniqueness across all Coach profiles
5. THE System SHALL store specialties and teachingStyles as arrays of strings
6. WHEN a Coach sets their rate THEN the System SHALL store the value as an integer with a default of zero
7. THE System SHALL link each CoachProfile to exactly one User record via userId
8. WHEN a CoachProfile is deleted THEN the System SHALL cascade delete the associated User record

### Requirement 5: Display Username Validation

**User Story:** As a user with a public profile, I want a unique and memorable username, so that others can easily find and share my profile.

#### Acceptance Criteria

1. WHEN a user sets a displayUsername THEN the System SHALL validate the length is between 3 and 30 characters
2. WHEN a user sets a displayUsername THEN the System SHALL validate it contains only letters, numbers, and underscores
3. WHEN a user sets a displayUsername THEN the System SHALL validate it does not start with a number
4. WHEN a user sets a displayUsername THEN the System SHALL store it in lowercase format for case-insensitive uniqueness
5. WHEN a user sets a displayUsername THEN the System SHALL validate it is URL-safe without spaces or special characters

### Requirement 6: Coach Discovery and Listing

**User Story:** As a student, I want to browse and search for coaches, so that I can find a coach who matches my needs and preferences.

#### Acceptance Criteria

1. WHEN a Student views the coaches page THEN the System SHALL display a list of all Coach profiles with basic information
2. WHEN displaying Coach cards THEN the System SHALL show displayUsername, name, bio, rate, specialties, teachingStyles, profileImage, and isVerified status
3. WHEN a Student clicks on a Coach card THEN the System SHALL navigate to the detailed Coach profile page
4. WHEN accessing a Coach profile by displayUsername THEN the System SHALL resolve the URL to the correct Coach record
5. WHEN accessing a Coach profile by coachProfileId THEN the System SHALL resolve the URL to the correct Coach record as a fallback

### Requirement 7: Coach Profile Display

**User Story:** As a student, I want to view detailed information about a coach, so that I can make an informed decision about booking a session.

#### Acceptance Criteria

1. WHEN a Student views a Coach profile THEN the System SHALL display the Coach name, bio, experience, specialties, teachingStyles, rate, isVerified status, headerImage, and profileImage
2. WHEN a Coach profile does not exist for the requested username THEN the System SHALL display a not-found page
3. WHEN displaying a Coach profile THEN the System SHALL generate appropriate page metadata including title and description for search engines
4. WHEN a Coach has a profileImage stored as binary data THEN the System SHALL convert it to a base64 data URL for display
5. THE System SHALL display the Coach account creation date on the profile page

### Requirement 8: Video Collection Management

**User Story:** As a student, I want to create and organize collections of my gameplay videos, so that coaches can review my performance and provide feedback.

#### Acceptance Criteria

1. WHEN a Student creates a Video Collection THEN the System SHALL require a title and allow optional description and mediaType
2. THE System SHALL support two media types: URL_VIDEO and FILE_VIDEO
3. WHEN a Student creates a Video Collection THEN the System SHALL link it to their User record via userId
4. WHEN a Student views their Video Collections THEN the System SHALL display only collections where isDeleted is false
5. WHEN a Video Collection is deleted THEN the System SHALL set isDeleted to true and record deletedAt timestamp instead of removing the record

### Requirement 9: Media Management within Collections

**User Story:** As a student, I want to add individual videos to my collections, so that I can organize my gameplay footage for coach review.

#### Acceptance Criteria

1. WHEN a Student adds Media to a Video Collection THEN the System SHALL require a title and collectionId
2. WHEN adding URL-based Media THEN the System SHALL store the videoUrl field
3. WHEN adding file-based Media THEN the System SHALL store fileKey, fileName, fileSize, duration, and thumbnailUrl fields
4. WHEN a Student views Media in a collection THEN the System SHALL display only media where isDeleted is false
5. WHEN Media is deleted THEN the System SHALL set isDeleted to true and record deletedAt timestamp instead of removing the record
6. WHEN a Video Collection is deleted THEN the System SHALL cascade delete all associated Media records

### Requirement 10: Video Collection Access Control

**User Story:** As a user, I want appropriate access to video collections based on my role, so that student privacy is maintained while allowing coaches to review assigned videos.

#### Acceptance Criteria

1. WHEN a Student views the video collections page THEN the System SHALL display only Video Collections where userId matches the Student userId
2. WHEN a Coach views the video collections page THEN the System SHALL display all Video Collections from all Students
3. WHEN an Admin views the video collections page THEN the System SHALL display all Video Collections from all Students
4. WHEN displaying Video Collections to Coaches or Admins THEN the System SHALL show the creator firstName and lastName
5. WHEN a Student attempts to create a Video Collection THEN the System SHALL allow the operation
6. WHEN a Coach attempts to create a Video Collection THEN the System SHALL deny the operation
7. WHEN a Facility attempts to create a Video Collection THEN the System SHALL deny the operation

### Requirement 11: Profile Image Upload and Display

**User Story:** As a user, I want to upload and display profile images, so that my profile is visually identifiable and professional.

#### Acceptance Criteria

1. WHEN a user uploads a profile image THEN the System SHALL store the binary image data in the profileImage field
2. WHEN a user uploads a profile image THEN the System SHALL store the MIME type in the profileImageType field
3. WHEN displaying a profile image THEN the System SHALL convert the binary data to a base64 data URL using the stored MIME type
4. WHEN a user has no profile image THEN the System SHALL display a default avatar or placeholder
5. THE System SHALL support image cropping functionality before upload

### Requirement 12: Database Schema Validation

**User Story:** As a system administrator, I want the database schema to enforce data integrity constraints, so that the application data remains consistent and valid.

#### Acceptance Criteria

1. THE System SHALL enforce unique constraints on User clerkUserId field
2. THE System SHALL enforce unique constraints on StudentProfile displayUsername field
3. THE System SHALL enforce unique constraints on CoachProfile displayUsername field
4. THE System SHALL create database indexes on User clerkUserId for query performance
5. THE System SHALL create database indexes on VideoCollection userId and isDeleted fields for query performance
6. THE System SHALL create database indexes on Media collectionId and isDeleted fields for query performance
7. THE System SHALL enforce foreign key relationships with cascade delete behavior where specified

### Requirement 13: Soft Deletion Implementation

**User Story:** As a system administrator, I want deleted records to be marked rather than removed, so that data can be recovered if needed and audit trails are maintained.

#### Acceptance Criteria

1. WHEN a Video Collection is deleted THEN the System SHALL set the isDeleted field to true
2. WHEN a Video Collection is deleted THEN the System SHALL record the current timestamp in the deletedAt field
3. WHEN a Media item is deleted THEN the System SHALL set the isDeleted field to true
4. WHEN a Media item is deleted THEN the System SHALL record the current timestamp in the deletedAt field
5. WHEN querying Video Collections or Media THEN the System SHALL exclude records where isDeleted is true by default

### Requirement 14: Type Safety and Validation

**User Story:** As a developer, I want type-safe API communication and data validation, so that runtime errors are minimized and data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL use tRPC for type-safe client-server communication
2. WHEN API endpoints receive data THEN the System SHALL validate input using Zod schemas
3. WHEN database operations occur THEN the System SHALL use Prisma client for type-safe queries
4. THE System SHALL maintain consistency between Prisma schema constraints and Zod validation rules
5. WHEN validation fails THEN the System SHALL return descriptive error messages to the client

### Requirement 15: Coach-Student Media Interaction

**User Story:** As a coach, I want to view media posted by students and provide feedback notes, so that I can offer personalized coaching guidance and track student progress.

#### Acceptance Criteria

1. WHEN a Coach views student media THEN the System SHALL display all Media items from all Students with associated Student information
2. WHEN a Coach selects a specific Media item THEN the System SHALL display the media content along with Student name, collection title, and media details
3. WHEN a Coach views a Media item THEN the System SHALL show any existing coaching notes associated with that media
4. WHEN a Coach adds or updates a coaching note for Media THEN the System SHALL persist the note with timestamp and Coach identification
5. WHEN a Coach deletes a coaching note THEN the System SHALL remove the note while preserving the Media record

### Requirement 16: Media Coaching Notes Management

**User Story:** As a coach, I want to create, edit, and manage my coaching notes on student media, so that I can provide detailed feedback and maintain coaching records.

#### Acceptance Criteria

1. WHEN a Coach creates a coaching note THEN the System SHALL require the mediaId, coachId, and note content
2. WHEN a Coach updates an existing coaching note THEN the System SHALL preserve the original creation timestamp while updating the modification timestamp
3. WHEN displaying coaching notes THEN the System SHALL show the Coach name, note content, creation date, and last modified date
4. THE System SHALL enforce a maximum length of 2000 characters for coaching note content
5. WHEN a Media item is soft-deleted THEN the System SHALL preserve associated coaching notes for audit purposes

### Requirement 17: Coach-Media Relationship Tracking

**User Story:** As a system administrator, I want to track which coaches have interacted with which student media, so that coaching relationships and feedback history are maintained.

#### Acceptance Criteria

1. THE System SHALL create a MediaCoachNote model to link Media, Coach, and coaching feedback
2. WHEN a Coach views Media THEN the System SHALL record the Coach userId and Media mediaId association
3. WHEN querying coaching notes THEN the System SHALL include Coach profile information and Media details
4. THE System SHALL enforce that only Coaches and Admins can create coaching notes on Media
5. THE System SHALL prevent Students and Facilities from creating coaching notes on Media

### Requirement 18: Coach Dashboard Metrics

**User Story:** As a coach, I want to see real-time metrics about my coaching activity on my dashboard, so that I can track my performance and student engagement.

#### Acceptance Criteria

1. WHEN a Coach views their dashboard THEN the System SHALL display the total count of unique students who have uploaded media that the coach can review
2. WHEN a Coach views their dashboard THEN the System SHALL display the count of coaching notes created by the coach within the current week
3. WHEN calculating weekly coaching activity THEN the System SHALL consider notes created from Monday 00:00 to Sunday 23:59 of the current week
4. WHEN a Coach has no students or weekly activity THEN the System SHALL display zero values rather than placeholder text
5. THE System SHALL update dashboard metrics in real-time when new student media is uploaded or coaching notes are created
