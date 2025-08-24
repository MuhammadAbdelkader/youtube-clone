# 📝 Contributing Guidelines

Welcome to the **YouTube Clone (MEAN Stack)** project! 👋  
Thank you for your interest in contributing. Please follow these guidelines to maintain project organization and quality.

---

## 🚀 Getting Started (From Clone to Development)

### 1. Clone the Repository
```bash
git clone https://github.com/MuhammadAbdelkader/youtube-clone.git
cd youtube-clone
git checkout dev
```

### 2. Install Dependencies

**Backend (server):**
```bash
cd server
npm install
```

**Frontend (client):**
```bash
cd ../client
npm install
```

### 3. Environment Variables

Create a `.env` file inside the `server/` directory.

Add variables like:
```env
PORT=5000
MONGO_URI=Link of Shared atlas DB of the team
JWT_SECRET=your-secret-key
```

⚠️ **Do not commit `.env` file.**

### 4. Run the Project

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
ng serve -o
```

---

## 📂 Project Structure

```
youtube-clone/                     # Root folder (Git repo)
│
├── client/                         # Angular Frontend (created by Angular CLI)
│   ├── public/                     # Public assets for Angular (images, icons, etc.)
│   │
│   ├── src/
│   │   ├── app/                    # Components, modules, services
│   │   ├── index.html              # Main HTML file
│   │   ├── main.ts                 # App entry point
│   │   └── styles.css              # Global styles
│   │
│   ├── angular.json                # Angular project configuration
│   ├── package.json                # Frontend dependencies
│   ├── package-lock.json           # Frontend dependencies lock
│   ├── tsconfig.json               # TypeScript configuration
│   └── .gitignore                  # Ignored frontend files
│
├── server/                         # Express Backend
│   ├── __tests__/                  # Backend-specific tests
│   ├── config/                     # DB connection, environment config
│   ├── controllers/                # Request handlers
│   ├── models/                     # Mongoose schemas & models
│   ├── routes/                     # Express routes
│   ├── middlewares/                # Custom middlewares (auth, validation…)
│   ├── utils/                      # Helpers (JWT, nodemailer, etc.)
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│   ├── README.md                   # Backend-specific documentation
│   ├── package.json                # Backend dependencies
│   ├── package-lock.json           # Backend dependencies lock
│   └── .env.example                # Environment variables examples
│
├── docs/                           # Project documentation, diagrams, specs
│
├── tests/                          # Root-level tests (general, e2e, integration)
│
├── CONTRIBUTING.md                 # Guidelines for contributing to this project
├── LICENSE                         # Project license information
├── README.md                       # Project documentation
└── .gitignore                      # Root-level ignored files

```

---

## 🔄 Workflow for Contributors

### 1. Create a New Branch

- **Feature** → `feature/<feature-name>`
- **Fix** → `fix/<bug-name>`

**Example:**
```bash
git checkout -b feature/auth
```

### 2. Commit Standards

**✅ Good Examples:**
- `feat: add user login with JWT`
- `fix: correct video upload validation`

**❌ Avoid:**
- `update files`
- `fix stuff`

### 3. Push Branch
```bash
git push origin feature/auth
```

### 4. Pull Request (PR)

- **Target** → `dev`
- **Title** → clear & descriptive
- **Description** → include:
  - Purpose
  - Key changes
  - Steps to test
  - Screenshots if needed

---

## ✅ Code Standards

### Backend
- RESTful API design
- Code in `server/`
- Sensitive data in `.env`
- Proper error handling
- Input validation on all routes

### Frontend
- Code in `client/`
- Use Angular CLI
- Clean component structure
- TypeScript best practices

### Database
- Use Mongoose
- Schema validation
- Consistent naming
- Add indexes for performance

### Testing
- Add tests in `tests/`
- Unit + integration tests
- Maintain >80% coverage

---

## 📌 Branch Protection Rules

- ❌ No direct push to `main`
- `dev` = main working branch
- All changes → PR → code review → merge
- Tests must pass before merge

---

## 🔄 Sync Your Branch with dev

```bash
git checkout dev
git pull origin dev
git checkout feature/your-feature
git merge dev
```

Or use rebase:
```bash
git rebase dev
```

---

## ⚠️ Common Issues You Might Face

### Merge Conflicts
- Run `git pull origin dev` before starting work
- Resolve conflicts locally and re-commit

### Missing .env
- Ensure `.env` exists in `server/`
- Copy from `.env.example` if provided

### Package Errors
- Run `npm install` inside both `client/` and `server/`
- Delete `node_modules/` and reinstall if needed

### MongoDB Connection Issues
- Check if MongoDB is running locally
- Verify your `MONGO_URI` in `.env`

---

## 💡 Best Practices

- Read `README.md` before contributing
- Use Issues to discuss before implementing features
- Keep commits small & meaningful
- Run linter + tests before pushing

---

## 📝 Documentation

- Update docs for any API or setup changes
- Add JSDoc comments to functions
- Update `README.md` if setup steps change

---

## 🙏 Thank You

Your contributions help make this project better for everyone.  
Follow these steps and let's build something amazing together 🚀