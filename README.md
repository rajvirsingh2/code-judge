# ⚖️ Code Judge

A full-stack online judge / coding-practice platform. Users can browse problems, write code in the browser, **run** it against custom input or **submit** it against hidden test cases, track their progress, and compete on a leaderboard. It also has built-in **Gemini-powered AI assistance**.

The system is split into three independently deployable services:

| Service | Folder | Responsibility |
|---|---|---|
| **Web client** | [`frontend/`](./frontend) | React SPA for problems, the code editor, the profile, and rankings |
| **Platform API** | [`backend/`](./backend) | Auth, problem management, user stats, submissions, and the AI assistant |
| **Compiler service** | [`onlinecompiler/`](./onlinecompiler) | Compiles and runs user code, judges it against test cases, and reports verdicts |

---

## ✨ Features

- 🔐 **Authentication**: sign up and log in, with session checks handled through a global auth context
- 📚 **Problem catalogue**: browse and filter problems, and view full problem statements
- 💻 **In-browser code editor**: write solutions and run them against custom input
- ✅ **Judging against hidden tests**: submissions run against the problem's hidden test cases and get a verdict
- 📈 **User statistics**: solved problems, submission history, and per-user stats
- 🏆 **Leaderboard and profile**: see rankings and your own progress
- 🛠️ **Problem management**: protected endpoints for creating and editing problems
- 🤖 **AI assistance**: Gemini-backed hints and explanations from the problem page
- 🧱 **Isolated execution**: code runs in a separate compiler service, away from the main API

---

## 🏗️ Architecture

```mermaid
flowchart TD
    U((Platform user)) --> FE

    subgraph FE[Web client · React]
        APP[Route views<br/>App.jsx]
        PD[Problem views<br/>ProblemDetail.jsx]
        PL[Problem listing<br/>Problems.jsx]
        PR[Profile & rankings<br/>Profile.jsx]
        AC[Auth state<br/>AuthContext.jsx]
        APP --> PD & PL
        APP --> AC
        PR --> AC
    end

    subgraph API[Platform API · Express]
        S[server.js]
        AR[authRoutes] --> ACt[authController]
        PRt[problemRoutes] --> PCt[problemController]
        UR[userRoutes] --> UCt[userController]
        SR[submissionRoutes] --> SCt[submissionController]
        GR[geminiRoutes] --> GCt[geminiController] --> GS[geminiService]
        S --> AR & PRt & UR & SR & GR
        MW[auth.js middleware]
        PRt -. guards writes .-> MW
        UR -. guards stats .-> MW
        GR -. guards access .-> MW
    end

    subgraph CE[Compiler service · Express]
        CS[server.js] --> RS[compilerController<br/>Run & Submit]
        RS --> GF[generateFile.js]
        RS --> GI[Input generation]
        RS --> EX[executeCode.js]
    end

    subgraph DB[(MongoDB)]
        UM[(User)]
        PM[(Problem)]
        SM[(Submission)]
    end

    PD -- run / submit --> CS
    PD & PL & AC -- REST --> S
    RS -- fetch test cases --> PRt
    RS -- report verdict --> SR
    ACt & PCt & UCt & SCt --> DB
    GS --> GEM[[Google Gemini API]]
```

### Request flow: submitting a solution

1. The user writes code on the **Problem view** (`ProblemDetail.jsx`) and clicks **Submit**.
2. The frontend's **Compiler API client** sends the code, language, and problem ID to the **Compiler service**.
3. The compiler service fetches the problem's **hidden test cases** from the Platform API's problem routes.
4. For each test case, it writes the source and input files (`generateFile.js`), then compiles and runs them (`executeCode.js`).
5. The outputs are compared with the expected results to produce a verdict (e.g., Accepted, Wrong Answer, or an error).
6. The verdict is **reported back** to the Platform API's submission routes. `submissionController` stores the submission and updates the user's solved list and stats.
7. The frontend shows the result, and the profile and leaderboard reflect the new data.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (JSX), React Router, Context API <!-- TODO: confirm Vite / Tailwind etc. --> |
| Backend API | Node.js, Express |
| Compiler service | Node.js, Express, `child_process` for compiling and running code |
| Database | MongoDB (Mongoose models: `user.js`, `problem.js`, `submission.js`) |
| AI | Google Gemini API |
| Auth | Token-based auth middleware (`auth.js`) <!-- TODO: confirm JWT / cookies --> |
| CI/CD | GitHub Actions (`.github/workflows`) |

---

## 📁 Project Structure

```
code-judge/
├── .github/workflows/        # CI/CD pipelines
├── backend/                  # Platform API
│   ├── controller/
│   │   ├── authController.js
│   │   ├── problemController.js
│   │   ├── submissionController.js
│   │   ├── userController.js
│   │   └── geminiController.js
│   ├── middleware/auth.js    # Authorization guard
│   ├── models/               # user.js, problem.js, submission.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── problemRoutes.js
│   │   ├── submissionRoutes.js
│   │   ├── userRoutes.js
│   │   └── geminiRoutes.js
│   ├── services/geminiService.js
│   └── server.js
├── frontend/                 # React web client
│   └── src/
│       ├── api/              # auth.js, problems.js, compiler.js, gemini.js
│       ├── context/AuthContext.jsx
│       ├── pages/            # Problems.jsx, ProblemDetail.jsx, Profile.jsx, ...
│       ├── App.jsx
│       └── main.jsx
└── onlinecompiler/           # Code execution service
    ├── controllers/compilerController.js
    ├── generateFile.js
    ├── executeCode.js
    └── server.js
```
<!-- TODO: adjust folder names (e.g. middleware/, models/, services/, api/) to match the repo exactly -->

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB**, either a local instance or MongoDB Atlas
- **Compilers/interpreters** for the languages you want to support (e.g., `g++`, `python3`, `java`) installed on the machine running `onlinecompiler`
- A **Google Gemini API key** for AI assistance

### 1. Clone the repository

```bash
git clone https://github.com/rajvirsingh2/code-judge.git
cd code-judge
```

### 2. Configure environment variables

Create a `.env` file in each service. <!-- TODO: match variable names used in the code -->

**`backend/.env`**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/code-judge
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

**`onlinecompiler/.env`**
```env
PORT=8000
BACKEND_URL=http://localhost:5000
```

**`frontend/.env`**
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_COMPILER_URL=http://localhost:8000
```

### 3. Install dependencies and run each service

Open three terminals:

```bash
# Terminal 1: Platform API
cd backend
npm install
npm start          # or: npm run dev
```

```bash
# Terminal 2: Compiler service
cd onlinecompiler
npm install
npm start
```

```bash
# Terminal 3: Web client
cd frontend
npm install
npm run dev
```

Then open the frontend in your browser (by default **http://localhost:5173**).

---

## 🔌 API Overview

All routes are mounted in `backend/server.js`. 🔒 marks routes protected by the `auth.js` middleware.

| Area | Base route | Description |
|---|---|---|
| Auth | `/api/auth` | Register, log in, log out, and check the current session |
| Problems | `/api/problems` | List and fetch problems (public); create, update, and delete problems 🔒 |
| Users | `/api/users` | User profile, stats, and leaderboard 🔒 |
| Submissions | `/api/submissions` | Record verdicts reported by the compiler service, and list submissions |
| Gemini | `/api/gemini` | AI hints and explanations for a problem 🔒 |

**Compiler service**

| Endpoint | Description |
|---|---|
| `POST /run` | Run code against custom input and return the output |
| `POST /submit` | Judge code against the problem's hidden tests and report the verdict to the API |

<!-- TODO: verify exact paths and HTTP methods -->

---

## 🧪 Supported Languages

<!-- TODO: update to match executeCode.js -->
| Language | Toolchain |
|---|---|
| C++ | `g++` |
| Python | `python3` |
| Java | `javac` / `java` |

---

## 🔒 Security Notes

Running untrusted code is risky. For production deployments, consider the following:

- Run `onlinecompiler` inside a **Docker container** with no network access and limited CPU and memory.
- Enforce **time limits and memory limits** on every execution.
- Clean up generated source and input files after each run.
- Keep the compiler service's verdict-reporting endpoint **unreachable from the public internet**, or protect it with a shared secret.

---

## 🗺️ Roadmap

- [ ] Containerised, sandboxed execution
- [ ] Contest mode with timed rounds
- [ ] Problem tags, difficulty filters, and search
- [ ] Per-test-case runtime and memory reporting
- [ ] Discussion and editorial section per problem

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request.

---

## 📄 License

<!-- TODO: add a LICENSE file and update this section -->
This project is licensed under the MIT License.

---

## 👤 Author

**Rajvir Singh**: [@rajvirsingh2](https://github.com/rajvirsingh2)
