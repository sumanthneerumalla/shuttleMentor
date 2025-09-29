# ShuttleMentor Development Plan

## Getting Started

To start working on the next phase of development:

1. **Coach Pages Development**
   - Begin with the coaches listing page at `/coaches`
   - Reuse the ProfileAvatar component for coach cards

2. **Recommended First Task**
   - Create the basic coaches listing page structure
   - Implement the coach card component

## Recently Completed

- ✅ Created ProfileAvatar component with fallback initials
- ✅ Enhanced ProfileImageUploader with internal state management
- ✅ Fixed profile image deletion functionality
- ✅ Migrated to new ProfileImageDisplay with improved design
- ✅ Updated CoachProfile to use the new components
- ✅ Improved component documentation
- ✅ Fixed z-index issue with profile image delete button
- ✅ Enhanced ProfileImageUploader with filename display and better button styling

## Next Steps

### 1. Coach Pages Development (High Priority)

#### Database Updates
- [x] Add displayUsername field to CoachProfile and StudentProfile models
- [x] Create and run database migration
- [x] Update Zod validation schemas to include displayUsername

#### Coaches Listing Page
- [ ] Create `/coaches` route and page component
- [ ] Implement API endpoint to fetch coaches with filtering and pagination
- [ ] Design and implement CoachCard component using ProfileAvatar
- [ ] Create CoachFilters component for filtering options
- [ ] Implement search functionality
- [ ] Add sorting options (by rate, name, etc.)

#### Coach Detail Page
- [ ] Create `/coaches/[username]` dynamic route using displayUsername
- [ ] Implement API endpoint to fetch coach by username
- [ ] Design coach profile detail layout
- [ ] Display coach specialties and teaching styles
- [ ] Show full bio and experience sections
- [ ] Implement booking interface
- [ ] Add reviews section

#### Profile Management
- [ ] Update CoachProfile component to allow setting displayUsername
- [ ] Implement validation for unique usernames
- [ ] Add username availability checking
- [ ] Add help text explaining username requirements

### 2. User Experience Improvements (Medium Priority)

#### Profile Management
- [ ] Add email verification flow
- [ ] Implement account settings page
- [ ] Create notification preferences

#### Dashboard Enhancements
- [ ] Design student dashboard with progress tracking
- [ ] Create coach dashboard with session management
- [ ] Implement analytics for coaches

### 3. System Improvements (Medium Priority)

#### Code Quality
- [ ] Add comprehensive comments to complex functions
- [ ] Implement unit tests for critical components
- [ ] Refactor repeated patterns into shared utilities

#### Performance Optimization
- [ ] Implement image optimization and caching
- [ ] Add server-side pagination for large data sets
- [ ] Optimize API response times

### 4. Deployment Preparation (Low Priority)

- [ ] Set up Docker containers for development/production
- [ ] Configure PostgreSQL for production
- [ ] Implement CI/CD pipeline
- [ ] Set up monitoring and logging
- [ ] update zod typing in user.ts route file to make them reusable. define once and use in multiple places