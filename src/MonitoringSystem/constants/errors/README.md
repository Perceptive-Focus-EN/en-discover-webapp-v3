# Error definition with breadcrumbs

## Error Tracing/Routing

In our system, we have a way to handle errors that makes it easy to understand what went wrong. Think of error tracing as GPS coordinates for error routing, and error messages as what shows up on the screen. This is done using something called an "enum" (a list of named values) for error types and an object (a collection of key-value pairs) for error messages.

### BusinessError Enum

An "enum" (short for enumeration) is a way to define a set of named values. Here, we use it to list possible business errors.

```typescript
export enum BusinessError {
  USER_NOT_FOUND = 'business/user/not_found' // category/entity/specific
}
```

- `USER_NOT_FOUND`: This error occurs when the system cannot find the user you are looking for.

### BusinessMessages Object

The `BusinessMessages` object contains human-readable messages for each error. These messages help users understand what went wrong.

```typescript
export const BusinessMessages = {
  [BusinessError.USER_NOT_FOUND]: {
    error: 'User not found', // This message is shown when an error occurs.
    warn: 'User search failed', // This message is shown as a warning.
    info: 'User lookup completed' // This message is shown as an informational note.
  }
}
```

- `error`: This is the message displayed when something goes wrong.
- `warn`: This is a warning message that indicates a potential issue.
- `info`: This is an informational message that provides additional context.

By using these enums and messages, we ensure that errors are clearly communicated to users, making the system easier to use and understand.

### Backend and Client-Side Interaction

To better understand how the backend and client-side work together using these enums and messages, let's look at a visual example:

#### Backend Example

In the backend, an error might be thrown when a user is not found:

```typescript
import { BusinessError, BusinessMessages } from './constants/errors';

function findUser(userId: string) {
  const user = database.findUserById(userId);
  if (!user) {
    throw new Error(BusinessError.USER_NOT_FOUND);
  }
  return user;
}
```

#### Client-Side Example

On the client-side, the error can be caught and handled appropriately:

```javascript
import { BusinessError, BusinessMessages } from './constants/errors';

async function handleUserSearch(userId) {
  try {
    const user = await api.findUser(userId);
    console.log('User found:', user);
  } catch (error) {
    if (error.message === BusinessError.USER_NOT_FOUND) {
      alert(BusinessMessages[BusinessError.USER_NOT_FOUND].error);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}
```

In this example, the backend throws a specific error when a user is not found, and the client-side catches this error and displays a user-friendly message. This ensures a seamless and understandable error handling process for the end-user.

<details>
<summary>Example: Adding to the Error Workflow</summary>

```typescript
// Backend Error (GPS coordinates for system)
export enum BusinessError {
  USER_NOT_FOUND = 'business/user/not_found'
}

// Frontend Message (What users see)
export const BusinessMessages = {
  [BusinessError.USER_NOT_FOUND]: {
    error: 'Unable to find your account', // User friendly
    warn: 'Having trouble locating account details', // User friendly
    info: 'Account lookup completed' // User friendly
  }
}

// SCENARIO 1: Updating Messages Only
// We can make messages more friendly without touching errors
export const BusinessMessages = {
  [BusinessError.USER_NOT_FOUND]: {
    error: 'We couldn\'t find your account. Please check your details', // ✅ Better message
    warn: 'We\'re having trouble finding your account', // ✅ Better message
    info: 'Account check complete' // ✅ Better message
  }
}

// SCENARIO 2: Adding New Error Type
export enum BusinessError {
  USER_NOT_FOUND = 'business/user/not_found',
  USER_LOCKED = 'business/user/locked' // ✅ New error type
}

// MUST add corresponding message
export const BusinessMessages = {
  [BusinessError.USER_NOT_FOUND]: { ... },
  [BusinessError.USER_LOCKED]: { // ✅ Required new message
    error: 'Your account is temporarily locked',
    warn: 'Your account may be locked soon',
    info: 'Account status checked'
  }
}
```

</details>

Note about hte different betwen status code and code. 
statusCode:

Used for HTTP responses
Standard HTTP status codes (200, 404, 500, etc.)
Indicates the type of HTTP response
Used by clients to handle responses


code:

Application-specific error tracking
Custom error codes for logging
Used for error grouping and monitoring
More granular than HTTP status codes
Helps with debugging and error tracking