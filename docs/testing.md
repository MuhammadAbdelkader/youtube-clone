# YouCube v2.0 - Automated Testing

## Jest Engine
The project utilizes **Jest** for automated unit and integration tests, alongside **Supertest** for HTTP route assertions.

## Test Suites
Tests are located in the `/test` directory at the project root:
1. **`auth.model.test.js`**: Asserts Mongoose `sparse` index behaviors, verifying that standard email users do not crash due to `googleId: null` duplicates.
2. **`validation.middleware.test.js`**: Asserts the Joi validation interceptor correctly formats output strings and blockades invalid requests.
3. **`profile.route.test.js`**: Asserts the PATCH profile HTTP workflow with a mocked authenticated user.

## Execution
Run the test suites by executing the following from the root or server directory:
```bash
cd server
npm run test ../test
# or
npx jest ../test
```
