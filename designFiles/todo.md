# ShuttleMentor Todo List

## Completed Tasks

### Backend
- ✅ Update Prisma schema with profile image fields and character limits
- ✅ Run migrations and verify database columns
- ✅ Create admin user script for testing
- ✅ Add profile image upload functionality to UserRouter
- ✅ Create helper functions for image processing
- ✅ Update Zod validation with character limits and size constraints
- ✅ Fix TypeScript errors in helper functions
- ✅ Regenerate Prisma client to recognize new fields
- ✅ Optimize API responses to exclude binary image data

### Frontend
- ✅ Create ImageCrop component with proper error handling
- ✅ Create shared ProfileImageUploader and ProfileImageDisplay components
- ✅ Add character counters to text inputs
- ✅ Fix nested button hydration errors
- ✅ Ensure proper base64 format for image data
- ✅ Create clean versions of profile components
- ✅ Update profile page to use clean components
- ✅ Fix TypeScript errors in profile page
- ✅ Update UserForFrontend and profile types for type safety
- ✅ Remove unused components (ClientSideNavigation)
- ✅ Enhance ProfileImageUploader with internal state management

## Remaining Tasks

### High Priority
1. **Test Profile Components**
   - Test image upload and cropping functionality
   - Verify profile images are saved and displayed correctly

2. **Create Coach Pages**
   - Build coaches listing page at /coaches
   - Build coach detail page at /coaches/{coachProfileId}
   - Implement coach card component with profile image

### Medium Priority
- Create ProfileAvatar component with default fallback
- Add comprehensive comments to complex functions
- Scan codebase for other instances where getCurrentUser can be reused

### Low Priority
- Add filtering/sorting options to coaches listing
- Improve error handling across the application
- Prepare for deployment (Docker, Postgres, Caddy)
- Update default profile image to be initials of the user if no image has been uploaded yet
