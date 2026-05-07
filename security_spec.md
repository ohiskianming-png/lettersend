# Security Specification - Digital Letterbox

## Data Invariants
1. A letter must have a sender UID that matches the authenticated user.
2. `createdAt` must be set to the server time during creation.
3. Letters are immutable after creation (optionally allowed deletion by sender).
4. `code` must be a valid alphanumeric string.
5. Anyone with the document ID (the "code") can read the letter.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a letter with a `senderId` that is not mine.
2. **State Injection**: Attempt to set `createdAt` to a past or future date manually.
3. **Ghost Fields**: Attempt to add fields not defined in the blueprint (e.g., `isVerified: true`).
4. **ID Poisoning**: Attempt to use a 1MB string as a document ID.
5. **Unauthorized Read**: Attempt to list all letters without being an admin (if list is restricted).
6. **Malicious Deletion**: Attempt to delete someone else's letter.
7. **Size Attack**: Attempt to send a 1MB string in the `content` field.
8. **Null Auth**: Attempt to create a letter without being signed in.
9. **Email Spoofing**: (Not applicable as we rely on UID, but good to check email_verified if we used email).
10. **Resource Exhaustion**: Creating thousands of letters in a loop (handled by rate limiting, but rules should restrict size).
11. **Type Mismatch**: Sending a number for `content`.
12. **Link Scraping**: Attempting to query all letters by `senderId` as a random user.

## Security Rules Implementation Strategy
- Global `deny all`.
- `isValidLetter` helper for schema validation.
- `create` restricted to signed-in users.
- `read` (get) allowed for anyone (since letters are accessed via shared link).
- `list` restricted to the owner's letters.
