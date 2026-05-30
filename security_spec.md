# Security Specification

## Data Invariants
1. Formulas belong to users and must have a valid `userId` matching their `auth.uid`.
2. UserProfiles belong to the user whose `uid` matches the document ID.

## The "Dirty Dozen" Payloads

*(Example payloads that should be rejected)*
1. Create Formula with `userId` not matching `request.auth.uid`.
2. Update Formula changing `userId`.
3. Create UserProfile for another user.
4. Update UserProfile for another user.
5. Create Formula with invalid `phLevel` (e.g. string).
6. Create Formula with missing required fields.
7. Update Formula with malicious string in `name` field (exceeding length).
8. List formulas not owned by user.
9. List UserProfiles not owned by user.
10. Update Formula status to 'finished' after terminal state.
11. Update Formula timestamp to past/future values.
12. Create Formula without `createdAt` set to `request.time`.
