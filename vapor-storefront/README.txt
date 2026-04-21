Make sure you have PostgreSQL installed.

1. Create a database
>createdb vapor
2. Run the schema and seed data
>psql vapor -f database/schema.sql
>psql vapor -f database/seed.sql
3. Navigate to the backend folder
>cd backend
4. Copy the .env example file and adjust it so it works
>cp .env.example .env
(change password to your local Postgres password and JWT_SECRET if necessary)
5. Start the backend
>node server.js