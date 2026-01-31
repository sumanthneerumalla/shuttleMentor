
# product development
 - let coaches upload their profile picture
 - build coaches profile pages: /coaches and /coaches/{coach-id}
   - ```lets work on adding 2 new pages at the root level /coaches and /coaches/{coachProfileId}.
   - use shadcn components with minimal styling and variants wherever possible.````

 - migrate to shadcns sidebar instead of using our own



# moving club id and name to a new table.

Next task is for us to instead of storing the club id and club name in the user model, i want to create a new table in the @schema.prisma file that stores club id and club name in a new table, and the user has a relation to it instead. Do some research on how the club id is used currently and tell me if i can rename it to "club shortname" in the new table we wish to create

and can you check in the video collections model whether the assignedCoachId and  assignedCoach   are added properly? do we need just one or both in order to make it work with prisma? i forget so please check and give me a clear answer.

 - dashboard for coaches needs to be cleaned up
- video colelction titles and content (except for video urls) should be editable
- coaches should only be able to see collections assigned to them
  - later we can allow coaches or facility users to mark collections as completed

club validation code in validation.ts needs to be reviewed if i make changes to club id and move it to a new table

binaryToBase64DataUrl is used in about 5 different locations when returning profiles or user objects to front end, flattening is occuring, this is an opportunity for code reuse

input schemas need to be moved to separate types at the top of the file in user.ts. also need to enforce  input sanitization via regex to not allow non standard characters on user first name, last name, or timezones even.

enforce this at db layer and also user form input side for faster feedback later.

code for getCoachDashboardMetrics needs to be reviewed and cleaned

only the video collection owner can set the assigned coach right now, i want facility owners and admins to also be able to set them.

src/app/profile/page.tsx won't need such specific club name and id validation if we can just only allow people to select their club from a drop down later. will let us get rid of stuff like validateClubFieldsRealTime, handleclubIdChange, handlelubNameChange. Can also probably simplify the ui related to displaying validation errors. We ideally want users to do as little related to this as possible, so the less we give them related to it, the better for us regarding maintainability of the codebase. When we revisit this, i want to delete as much of this as possible.

coachingNotes.getNotesByMedia converts buffer of profile picture into base64 on the client side rather than on the serverside as it is done when retrieving profiles of coaches or users. This needs to be fixed by replicating what is done for coach or user profiles and removing the burden from client browsers.

Today the UI condition for notes is:
  canCreateNotes = userType === COACH || ADMIN
  and that gates edit/delete buttons too. But backend allows edit/delete only if:

  note owner or ADMIN
  Recommended fix (clean + accurate)
  Have the backend include enough info per note so UI can decide:

  Option A (minimal): include coach.userId in getNotesByMedia response.
  Then in UI: canEdit = userType === ADMIN || note.coach.userId === currentUser.userId
  Same for delete.
  This requires CoachingNotesList to know currentUser.userId.

  Easiest: add currentUserId?: string prop and pass it from parent (both VideoCollectionDisplay and CoachingNoteModal already fetch user profile in some places).
  Alternatively, fetch api.user.getOrCreateProfile inside CoachingNotesList (but that’s an extra query; sometimes OK, but slightly heavier).


Need to implement focus trap and focus restore for the coach notes modal. Need to find a way to use radix to do this. Practical implementation recommendation
  If you have Radix UI in the project (you do, because Button uses radix-ui/react-slot and ProfileAvatar uses shadcn/radix Avatar), the most maintainable approach is:

  use a Radix/shadcn Dialog component
  it gives you focus trap, restore, escape handling, aria attributes, and portal layering.


styling for these ui components is very verbose:
  CoachSelector.tsx
  CoachingNoteForm.tsx
  CoachingNoteModal.tsx
  CoachingNotesList.tsx

error banners in coachSelector and coachingNotesForm have differrent error panels, we should be using a consistent global class

Reduce nested “panel in panel” duplication
  In VideoCollectionDisplay, you do:

  outer glass-panel p-6
  inner glass-panel p-6 for coaching notes section
  This doubles border/shadow visual density and increases CSS noise.

  Recommendation:

  choose one container and inside use panel-muted (or just spacing) for inner sections instead of another glass-panel.


src/app/dashboard/page.tsx needs to be read and reviewed and minimized, it feels large

A review of VideoCollectionDisplay.tsx shows that 
  Info import from lucide-react appears unused in both versions (still present).
  userType prop is still accepted but (in the current branch) the notes use user?.userType from the profile query instead.
  handleCoachAssigned takes coachId but doesn’t use it (it just refetches).

  these need to be cleaned up if possible.


some video collection or media endpoints need to be paginated, i dont think thats happening right now. maybe something already exists for this, it would be nice if the url paramters for video collections were supported for this.

video-collections/page.tsx seems to be doing direct database queries, i dont think this is the best way to do it. Maybe i should rely on paginated backend endpoints? related to above point.


see if we can switch to using shadcn or radix navbar instead of our own. having some annoying issues with our dropdown chevron icons and sections which i dont want to deal with