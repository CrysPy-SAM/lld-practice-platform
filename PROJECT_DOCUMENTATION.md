# PROJECT DOCUMENTATION

## LLD Practice Platform — CipherSchools Hiring Assignment (SEP 2026)

---

# 1. Project Overview

### What It Is

The **LLD Practice Platform** is a full-stack web application that helps software engineering learners practice Low-Level Design (LLD). It provides a focused, end-to-end practice loop: learners choose a design problem (e.g., Parking Lot, Elevator, Vending Machine), write a solution, submit it, receive structured multi-criteria feedback, review that feedback, and iterate on their design.

### The Problem It Solves

LLD practice is easy to start but difficult to evaluate. A learner can design a Parking Lot or Elevator system and still be unsure whether their class responsibilities, abstractions, relationships, and trade-offs are sound. This platform closes that gap with automated, explainable feedback that combines deterministic structural checks with LLM-style qualitative analysis.

### The User

A **learner** — someone preparing for software engineering interviews or looking to improve their system design skills. A pre-seeded "Default Learner" is provided on startup so the platform is immediately usable without sign-up.

### The Complete Learner Journey

```
Choose Problem
  → View Requirements
  → Start Attempt
  → Create/Edit Solution
  → Save Draft
  → Submit for Feedback
  → Generate Feedback
  → Review Feedback
  → View History
  → Try Again
```

Each step maps to a concrete API endpoint and UI action:

1. **Choose Problem**: The learner browses a catalog of 6 LLD problems, each with a description, requirements list, constraints, hints, tags, and difficulty rating.
2. **View Requirements**: Clicking a problem reveals its full details — requirements, constraints, and optional hints.
3. **Start Attempt**: A new `Attempt` record is created in `DRAFT` status, linking the learner to the problem.
4. **Create/Edit Solution**: The learner writes their solution in a free-form editor (text, pseudocode, class diagrams, or code) and provides an explanation of design decisions, patterns used, and trade-offs.
5. **Save Draft**: Progress is persisted without submitting; the attempt remains in `DRAFT`.
6. **Submit for Feedback**: The learner submits the draft; status transitions to `FEEDBACK_PENDING`.
7. **Generate Feedback**: A hybrid engine runs a rule-based provider (deterministic structural checks) and a simulated/real LLM provider, then merges their results into unified scores.
8. **Review Feedback**: The learner sees scores across 7 criteria (0–5 each), per-criterion comments, a summary, and actionable improvement suggestions.
9. **View History**: The learner sees all past attempts for a problem or across all problems, with statuses and outcomes.
10. **Try Again**: The learner starts a fresh attempt on the same or a new problem, building an improvement history over time.

### How It Satisfies the Assignment

The CipherSchools assignment asked for a focused MVP that demonstrates the practice loop with clear domain modeling. This implementation delivers:

- **Problem set**: 6 curated LLD problems with clear requirements and context.
- **Practice**: Full attempt lifecycle with draft saving and solution editing.
- **Submission**: Status-tracked submission with validation.
- **Feedback**: Hybrid multi-criteria evaluation (deterministic + LLM).
- **History**: Attempt history with per-problem filtering.
- **Core design**: Clean domain entities and interfaces with responsibility separation, patterns (Strategy, Repository, Factory-like use cases, Chain of Responsibility), and extensibility.
- **Tests**: 96 tests across 8 suites covering unit, integration, and edge/failure cases.
- **Documentation**: Research note, design note, README, and AI usage log.

---

# 2. Technology Stack

| Technology | Where It Is Used | Why It Is Used |
|---|---|---|
| **Node.js (>=20)** | Entire runtime | Event-driven, single-threaded; suitable for a monolith prototype. Uses built-in `crypto.randomUUID()` for ID generation. |
| **Express.js v5** | `src/app.js`, `src/api/routes/` | Minimal HTTP framework for the REST API and static file serving. |
| **CORS** | `src/app.js` | Enables cross-origin requests for the frontend. |
| **JavaScript (CommonJS)** | All source files | CommonJS (`require`/`module.exports`) is used throughout. `uuid` is listed in `package.json` but unused; the code uses `crypto.randomUUID()` from Node's built-in module. |
| **Jest** | Test runner (`jest.config.js`) | Unit and integration testing framework. |
| **Supertest** | `tests/integration/` | HTTP assertion library for testing Express endpoints. |
| **HTML / CSS / Vanilla JS** | `public/` | No frontend framework — pure HTML/CSS/JS for the browser UI. |
| **In-Memory Maps** | `src/infrastructure/repositories/` | `Map`-based repositories for data persistence during runtime. Not durable across restarts but easily swappable via the repository interface. |
| **OpenAI API** (optional) | `LLMBasedFeedbackProvider` via `fetch` | When `OPENAI_API_KEY` is set, the LLM feedback provider calls the real OpenAI Chat Completions API. Without a key, a simulation mode provides representative feedback. |

### Key Dependencies (from `package.json`)

- `express` ^5.2.1 — API and static server
- `cors` ^2.8.6 — Cross-origin middleware
- `uuid` ^14.0.2 — Listed in `package.json` but not imported by source code (superseded by `crypto.randomUUID()`)
- `jest` ^30.5.2 (dev) — Test runner
- `supertest` ^7.3.0 (dev) — HTTP testing

---

# 3. High-Level Architecture

The project follows a **Clean Architecture / Hexagonal** structure with four concentric layers. Dependencies always point inward: the domain layer knows nothing about infrastructure or presentation; the application layer depends on domain interfaces; infrastructure implements those interfaces.

```mermaid
flowchart TD
    UI["Web Frontend<br>HTML/CSS/JS"]
    API["Express API<br>REST Routes"]
    APP["Application Layer<br>Use Cases + Services"]
    DOMAIN["Domain Layer<br>Entities + Interfaces"]
    INFRA["Infrastructure Layer<br>Repositories + Feedback Providers"]
    REPO["Repositories<br>InMemory"]
    FEEDBACK["Feedback Providers<br>Rule + LLM"]
    PROBLEMS["Problem Catalog<br>6 Seeded Problems"]
    STATIC["Static Assets<br>public/"]

    UI -->|HTTP requests| API
    STATIC -->|served by| API
    API --> APP
    APP --> DOMAIN
    APP --> INFRA
    INFRA --> REPO
    INFRA --> FEEDBACK
    INFRA --> PROBLEMS

    classDef domFill fill:#1e3a5f,color:#fff
    classDef appFill fill:#5b21b6,color:#fff
    classDef infFill fill:#78350f,color:#fff
    classDef apiFill fill:#065f46,color:#fff
    classDef uiFill fill:#7c2d12,color:#fff

    class DOMAIN,domFill
    class APP,appFill
    class INFRA,REPO,FEEDBACK,PROBLEMS,infFill
    class API,apiFill
    class UI,STATIC,uiFill
```

### Layer Responsibilities

**Presentation/API Layer** (`src/api/`, `public/`)
- Express application with CORS and JSON body parsing.
- REST routes at `/api/*` and static file serving from `public/`.
- Centralized error handling middleware (`errorHandler.js`).
- Web frontend: single HTML page with tabbed solution editor, problem browser, and feedback display.

**Application Layer** (`src/application/`)
- **Services**: `PracticeService` manages the practice lifecycle; `FeedbackService` orchestrates multi-provider feedback generation with error handling.
- **Use Cases**: Six single-responsibility command/query classes (`ListProblems`, `StartAttempt`, `SaveSolutionDraft`, `SubmitAttempt`, `GenerateFeedback`, `GetAttemptHistory`).

**Domain Layer** (`src/domain/`)
- **Enums**: `SubmissionStatus` (DRAFT, SUBMITTED, FEEDBACK_PENDING, FEEDBACK_READY, FEEDBACK_FAILED), `SolutionFormat` (TEXT, CODE, DIAGRAM, MIXED), `FeedbackCriteria` (7 criteria), `FeedbackProviderType` (RULE_BASED, LLM).
- **Interfaces**: Abstract base classes for `FeedbackProvider`, `ProblemRepository`, `AttemptRepository`, `LearnerRepository` (Dependency Inversion Principle).
- **Entities**: `Learner`, `LldProblem`, `Solution`, `Attempt` (with state transitions), `Feedback`, `CriterionScore`, `AttemptHistory`.

**Infrastructure Layer** (`src/infrastructure/`)
- **Repositories**: `InMemoryProblemRepository`, `InMemoryAttemptRepository`, `InMemoryLearnerRepository` — concrete implementations of domain interfaces.
- **Feedback Providers**: `RuleBasedFeedbackProvider` (deterministic keyword/structural heuristics), `LLMBasedFeedbackProvider` (simulated or real OpenAI API), `FeedbackProviderChain` (Chain of Responsibility for fallback).
- **Problem Catalog**: Six pre-seeded LLD problems.

**Composition Root** (`src/container.js`)
- Wires all dependencies together at startup following the Dependency Inversion Principle. Seeds a default learner, pre-loads the problem catalog, and configures both feedback providers.

### Domain Model

Key entities and their relationships:

| Entity | Key Fields |
|---|---|
| `Learner` | id, name, email, createdAt |
| `LldProblem` | id, title, description, requirements[], constraints[], hints[], difficulty, tags[], createdAt |
| `Solution` | id, content, format, explanation, createdAt, updatedAt |
| `Attempt` | id, learnerId, problemId, solution, status, startedAt, submittedAt, feedback |
| `Feedback` | id, attemptId, providerType, scores[], overallScore, summary, suggestions, processedAt |
| `CriterionScore` | criterion, score (0-5), comment |
| `AttemptHistory` | learnerId, entries[] |

### Submission State Machine

```
DRAFT → (submit) → FEEDBACK_PENDING → (feedback generated) → FEEDBACK_READY
                                   ↘ (all providers fail) → FEEDBACK_FAILED
```

- `DRAFT`: Learner is actively editing their solution.
- `FEEDBACK_PENDING`: Solution submitted, waiting for evaluation.
- `FEEDBACK_READY`: Feedback successfully generated and attached.
- `FEEDBACK_FAILED`: All feedback providers failed; attempt remains but with a failure status visible in history.

### Feedback Engine

The `FeedbackService` runs **both** feedback providers:

1. **Rule-Based Provider** (deterministic): Analyzes solution text for class declarations, SOLID principle keywords, design pattern mentions, relationship modeling, trade-off discussion, and completeness ratio. Returns structured scores with per-criterion comments.
2. **LLM Provider** (simulated or real): With no API key, a simulated provider produces realistic structured feedback after a 500ms delay. With `OPENAI_API_KEY` set, it calls the OpenAI Chat Completions API with a prompt evaluating the solution.

Both providers' results are **merged** into a single `Feedback` object with combined scores, a concatenated summary, and deduplicated suggestions. If the LLM provider fails, the rule-based scores still produce valid feedback. Only if **all** providers fail does the attempt get marked `FEEDBACK_FAILED`.

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{ status: "ok", timestamp }` |
| GET | `/api/problems` | List all problems (supports `?tag=parking`) |
| GET | `/api/problems/:id` | Get a specific problem by ID |
| POST | `/api/attempts` | Start a new attempt (requires `problemId`; `learnerId` optional, defaults to seeded learner) |
| GET | `/api/attempts/:id` | Get an attempt by ID |
| PUT | `/api/attempts/:id/solution` | Save/update solution draft (requires `content`) |
| POST | `/api/attempts/:id/submit` | Submit draft for feedback |
| POST | `/api/attempts/:id/feedback` | Generate feedback (rule-based + LLM merge) |
| GET | `/api/attempts` | Get attempt history (supports `?learnerId=` and `?problemId=`) |
| GET | `/api/learner/default` | Get the seeded default learner |
| GET | `/` | Serve the web frontend |

### Web Frontend

A single-page application (vanilla JS) at `public/index.html` that provides:

- **Problem browser**: Grid of problem cards with difficulty badges and tags.
- **Attempt workspace**: Tabbed interface (Solution / Explanation / Feedback) with a textarea editor.
- **Action buttons**: Save Draft, Submit, Get Feedback.
- **Feedback display**: Bar-style score visualization per criterion, summary text, and suggestion list.
- **Attempt history**: Fetched and displayed in a dedicated section.

---

# 4. Testing Strategy

| Layer | Tests | Coverage |
|---|---|---|
| `tests/domain/` | Attempt, Feedback, Solution, interfaces (4 suites) | 24 tests |
| `tests/application/` | PracticeService, FeedbackService (1 suite) | 19 tests |
| `tests/infrastructure/` | Repositories, Feedback Providers, FeedbackProviderChain (2 suites) | 27 tests |
| `tests/integration/` | Full API flow via Supertest (1 suite) | 26 tests |
| **Total** | **8 suites** | **96 tests** |

**Edge cases covered**: empty solutions, unknown IDs, invalid status transitions, duplicate submissions, all-provider-failure scenarios, missing parameters, unknown routes (404).

---

# 5. Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Run tests (96 tests across 8 suites)
npm test

# 3. Start the server
npm start
# → Open http://localhost:3000 in your browser

# 4. Optional: Enable real LLM feedback
#    Set OPENAI_API_KEY=your-key in your environment before running npm start
```

### Test Commands

| Command | Description |
|---|---|
| `npm test` | Run all tests with verbose output |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with code coverage report |