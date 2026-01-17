
# product development
 - let coaches upload their profile picture
 - build coaches profile pages: /coaches and /coaches/{coach-id}
   - ```lets work on adding 2 new pages at the root level /coaches and /coaches/{coachProfileId}.
   - use shadcn components with minimal styling and variants wherever possible.````

 - migrate to shadcns sidebar instead of using our own



# moving club id and name to a new table.

Next task is for us to instead of storing the club id and club name in the user model, i want to create a new table in the @schema.prisma file that stores club id and club name in a new table, and the user has a relation to it instead. Do some research on how the club id is used currently and tell me if i can rename it to "club shortname" in the new table we wish to create

and can you check in the video collections model whether the assignedCoachId and  assignedCoach   are added properly? do we need just one or both in order to make it work with prisma? i forget so please check and give me a clear answer.