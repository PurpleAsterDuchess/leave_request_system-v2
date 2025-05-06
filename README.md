# Awesome Project Build with TypeORM

Steps to run this project:

1. Run `npm i` command
2. Setup database settings inside `data-source.ts` file
3. Run `npm start` command

Dev mode: npm run dev

test in watch mode: npm run test:watch <filePath>


Steps to add a new user:
1. Login to admin
    1a. POST http://localhost:8900/api/login
        body: { 
                "password": <password string>, 
                "email": "admin@email.com",
                "roleId": 1
        } 
    1b. copy token
2. POST http://localhost:8900/api/users/
    header {
        Authorization: Bearer <copied token>
        Content-Type: application/json
    }
    body {
        { 
        "password": <create password string>, 
        "email": "test@email.com", 
        "roleId": 
        } 
    }