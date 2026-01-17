# ShuttleMentor Development Plan

## Recently Completed

- ✅ Created ProfileAvatar component with fallback initials
- ✅ Enhanced ProfileImageUploader with internal state management
- ✅ Fixed profile image deletion functionality
- ✅ Migrated to new ProfileImageDisplay with improved design
- ✅ Updated CoachProfile to use the new components
- ✅ Improved component documentation
- ✅ Fixed z-index issue with profile image delete button
- ✅ Enhanced ProfileImageUploader with filename display and better button styling
- ✅ Added displayUsername field to CoachProfile and StudentProfile models
- ✅ Created and ran database migration
- ✅ Updated Zod validation schemas to include displayUsername
- ✅ Created `/coaches` route and page component
- ✅ Implemented API endpoint to fetch coaches with filtering and pagination
- ✅ Designed and implemented CoachCard component using ProfileAvatar
- ✅ Created `/coaches/[username]` dynamic route using displayUsername
- ✅ Implemented API endpoint to fetch coach by username
- ✅ Designed coach profile detail layout
- ✅ Displayed coach specialties and teaching styles
- ✅ Added full bio and experience sections
- ✅ Added basic sorting options (by rate, name, creation date)

## Next Steps

### 1. Dockerization (Highest Priority)

 - [x] Create Dockerfile for the Next.js application
 - [x] Set up docker-compose.yml to orchestrate app and database containers
 - [x] Configure environment variables for container communication
 - [x] Implement proper networking between app and PostgreSQL containers
 - [x] Create development and production Docker configurations
 - [x] Document Docker setup and usage instructions
 - [x] Add health checks for containers
 - [x] Optimize Docker image size for production
 - [x] After configuring production Clerk keys in `.env`, run the production Docker stack (docker-compose.yml + docker-compose.prod.yml) to validate prod deployment

### 2. Remaining Coach Features (High Priority)

#### Coach Filtering UI
- [ ] Create CoachFilters component for filtering options
- [ ] Implement search/filtering functionality in the UI
- [ ] Connect search/filtering to the existing API endpoint

#### Coach Profile Enhancements
- [ ] Implement booking interface (placeholder)
- [ ] Add reviews section (placeholder)
- [ ] Add header image support

#### Username Management
- [ ] Update CoachProfile component to allow setting displayUsername
- [ ] Implement validation for unique usernames
- [ ] Add username availability checking
- [ ] Add help text explaining username requirements

### 3. System Improvements (Medium Priority)

#### Code Quality
- [ ] Add comprehensive comments to complex functions
- [ ] Implement unit tests for critical components
- [ ] Refactor repeated patterns into shared utilities
- [ ] Update zod typing in user.ts and all route file to make them reusable and maintainable

#### Performance Optimization
- [ ] Optimize API response times
- [ ] add flame graph or profiling to find bottlenecks
- [ ] investigate which monitoring applications to use (datadog, sentry, etc)

### 4. User Experience Improvements (Medium Priority)

#### Profile Management
- [ ] Add email verification flow
- [ ] Implement account settings page
- [ ] Create notification preferences

#### Dashboard Enhancements
- [ ] Design student dashboard with progress tracking
- [ ] Create coach dashboard with session management
- [ ] Implement analytics for coaches

### 5. Deployment Preparation (Low Priority)

- [ ] Implement CI/CD pipeline
- [ ] Set up monitoring and logging
- [ ] Configure production database backups
- [ ] Implement security best practices