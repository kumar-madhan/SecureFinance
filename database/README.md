# SecureBank Database Setup

This directory contains SQL scripts for setting up and initializing the SecureBank application database.

## Files

- `schema.sql`: Contains the complete database schema including tables, indexes, constraints, and sample data.

## Setup Instructions

### Prerequisites

- PostgreSQL installed on your system
- Access to create databases and tables

### Setting Up the Database

1. Create a new PostgreSQL database:

```bash
createdb securebank
```

2. Run the schema script to create tables and populate with sample data:

```bash
psql -d securebank -f schema.sql
```

### Connecting the Application to PostgreSQL

To connect the application to the PostgreSQL database instead of using in-memory storage:

1. Create a `.env` file at the root of the project with the following variables:

```
DATABASE_URL=postgresql://yourusername:yourpassword@localhost:5432/securebank
SESSION_SECRET=your_session_secret_here
```

2. Implement a `DatabaseStorage` class in `server/storage.ts` that uses Drizzle ORM to connect to PostgreSQL. Here's a sample implementation:

```typescript
import connectPg from "connect-pg-simple";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.SessionStore;
  
  constructor() {
    const connectionString = process.env.DATABASE_URL || "";
    const queryClient = postgres(connectionString);
    this.db = drizzle(queryClient, { schema });
    
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString,
      },
      createTableIfMissing: true
    });
  }
  
  // Implement all the methods from IStorage interface
  // using drizzle ORM to interact with the database
  // ...
}
```

3. Update the storage initialization in `server/storage.ts`:

```typescript
// Choose storage implementation based on environment
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
```

## Database Schema

The database contains the following tables:

1. `users` - Stores user information for authentication and profile data
2. `accounts` - Stores bank accounts associated with users
3. `transactions` - Records all financial transactions in accounts
4. `transfers` - Tracks money transfers between accounts
5. `session` - Manages user sessions

See `schema.sql` for complete table definitions and relationships.

## Sample Data

The `schema.sql` script includes sample data with:

- 3 users (johndoe, janedoe, mikejones)
- 7 accounts of different types
- Various transactions and transfers

You can use these sample accounts for testing purposes.

## Notes

- In the sample data, passwords are stored as bcrypt hashes (they appear to be hashed but are just examples)
- Real passwords should be properly hashed using bcrypt with appropriate salt rounds
- The actual passwords for the sample users are not valid hashes and cannot be used for login