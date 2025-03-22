# API Endpoints for Badminton Coaching Platform

## Authentication
- `POST /api/auth/register` - Register new user (coach or student)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/password` - Update password

## Users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user details
- `GET /api/users/:id/profile` - Get user profile (redirects to student or coach profile)

## Student Profiles
- `POST /api/student/profile` - Create student profile
- `GET /api/student/profile/:id` - Get student profile details
- `PUT /api/student/profile/:id` - Update student profile
- `GET /api/student/sessions` - Get student's sessions (past, upcoming)
- `GET /api/student/coaches` - Get list of coaches the student has worked with

## Coach Profiles
- `POST /api/coach/profile` - Create coach profile
- `GET /api/coach/profile/:id` - Get coach profile details
- `PUT /api/coach/profile/:id` - Update coach profile
- `GET /api/coach/sessions` - Get coach's sessions (past, upcoming)
- `GET /api/coach/students` - Get list of students the coach has worked with
- `GET /api/coach/earnings` - Get coach earnings data

## Coach Availability
- `POST /api/coach/availability` - Add availability time slots
- `GET /api/coach/availability/:id` - Get specific availability
- `PUT /api/coach/availability/:id` - Update availability
- `DELETE /api/coach/availability/:id` - Delete availability
- `GET /api/coach/:id/availability` - Get all availability for a coach

## Videos & Video Groups
- `POST /api/videos/groups` - Create new video group
- `GET /api/videos/groups/:id` - Get video group details
- `PUT /api/videos/groups/:id` - Update video group
- `DELETE /api/videos/groups/:id` - Delete video group
- `GET /api/student/:id/videos/groups` - Get all video groups for a student
- `POST /api/videos` - Upload new video
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video details
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/groups/:id/videos` - Get all videos in a group

## Sessions
- `POST /api/sessions` - Create new coaching session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session details
- `DELETE /api/sessions/:id` - Cancel session
- `GET /api/sessions/:id/notes` - Get session notes
- `POST /api/sessions/:id/notes` - Add session note
- `PUT /api/sessions/:id/notes/:noteId` - Update session note
- `POST /api/sessions/:id/start` - Start session (create video call)
- `POST /api/sessions/:id/end` - End session

## Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment details
- `GET /api/coach/:id/payments` - Get payments for a coach
- `GET /api/student/:id/payments` - Get payments for a student

## Reviews
- `POST /api/reviews` - Create new review
- `GET /api/reviews/:id` - Get review details
- `PUT /api/reviews/:id` - Update review
- `GET /api/coach/:id/reviews` - Get all reviews for a coach

## Chat
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/:id` - Get conversation details
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/messages` - Send new message
- `GET /api/chat/conversations/:id/messages` - Get messages in a conversation
- `PUT /api/chat/messages/:id/read` - Mark message as read

## Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/coaches` - Get all coaches
- `GET /api/admin/students` - Get all students
- `PUT /api/admin/users/:id` - Update user (verify, suspend, etc.)
- `GET /api/admin/sessions` - Get all sessions
- `GET /api/admin/settings` - Get platform settings
- `PUT /api/admin/settings` - Update platform settings
