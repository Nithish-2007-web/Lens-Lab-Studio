# LensLab Studio — Member Contribution & Viva Guide

**Project:** LensLab Studio – Camera Rental Management System  
**Architecture:** Node.js • Express.js • SQLite3  
**Team Allocation Model:** Exactly Five Members (Strict Module Separation)  

---

## 1. Team Allocation Overview

The LensLab Studio backend architecture is intentionally decoupled into five distinct functional domains. Each domain is exclusively owned and maintained by an assigned team member to ensure clean code boundaries, clear accountability, and effortless explanation during academic evaluations and viva examinations.

| Member | Assigned Domain | Files Owned | Primary Deliverables |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Backend Server & Routing** | `server.js`<br>`routes.js` | Express app initialization, body-parser middleware, modular routing architecture, 404 handler, route order priority rules, and server startup lifecycle. |
| **Member 2** | **Database Management** | `database/database.js` | Asynchronous SQLite connection (`lensLab.db`), `PRAGMA foreign_keys = ON;`, schema definitions (`photographers`, `cameras`, `rentals`), singleton DB getter. |
| **Member 3** | **REST API Development** | `endpoints.js` | Camera CRUD operations, photographer registration and listing, rental booking, multi-table relational `INNER JOIN` query, and foreign key conflict handling. |
| **Member 4** | **Validation, Search & Special Requirements** | `validation.js`<br>`summary.js` | Express validation middleware (`validateCamera`), parameterized query search by camera kind (`?kind=...`), and inventory aggregation using SQL `GROUP BY`. |
| **Member 5** | **API Testing & Documentation** | `postman/LensLab.postman_collection.json`<br>`api.http`<br>`README.md`<br>`screenshots/` | Postman Collection v2.1.0 test suite, VS Code REST Client collection, visual verification screenshots, ER diagrams, and comprehensive architectural documentation. |

---

## 2. Comprehensive Member Contribution Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LensLab Studio Swarm Architecture               │
├───────────────┬────────────────────────────┬───────────────────────────┤
│ Member        │ Files Owned                │ Architectural Layer       │
├───────────────┼────────────────────────────┼───────────────────────────┤
│ Member 1      │ server.js, routes.js       │ Application & Routing     │
│ Member 2      │ database/database.js       │ Persistence & Schema      │
│ Member 3      │ endpoints.js               │ Business Logic & CRUD     │
│ Member 4      │ validation.js, summary.js  │ Validation & Aggregation  │
│ Member 5      │ postman/, api.http, README, screenshots/ │ Quality Assurance & Docs  │
└───────────────┴────────────────────────────┴───────────────────────────┘
```

---

## 3. Detailed Responsibilities and Viva Guide

---

### Member 1: Backend Server & Routing

#### Assigned Files
- `server.js`
- `routes.js`

#### Core Responsibilities
1. **Application Lifecycle:** Configure the Express application instance, bind environment PORT (`process.env.PORT || 3000`), and manage graceful boot sequence.
2. **Middleware Registration:** Register `express.json()` to parse inbound JSON request payloads before routing.
3. **Route Order Priority:** Enforce strict top-to-bottom routing rules. Crucially, mount `GET /cameras/summary` **before** parameterized route `GET /cameras/:cameraId` to prevent Express from capturing the literal string `"summary"` as a `:cameraId`.
4. **Global 404 Handler:** Implement a catch-all middleware (`app.use((req, res) => ...)`) returning HTTP 404 `{ "error": "Route not found" }` for undefined routes.
5. **Startup Synchronization:** Implement `initializeDBAndServer()` to ensure SQLite database tables and foreign keys are verified *before* the HTTP listener starts accepting traffic.

#### Key Functions & Code Artifacts
- `server.js`: `initializeDBAndServer()`, `app.use(express.json())`, `app.use('/', routes)`
- `routes.js`: Router instantiation, route mapping, middleware chain integration (`validateCamera`)

#### Viva Preparation & Model Q&A
> **Q1: Why must `GET /cameras/summary` be declared before `GET /cameras/:cameraId` in `routes.js`?**  
> **A:** Express resolves routes sequentially in order of registration. If `/:cameraId` was placed first, a request to `/cameras/summary` would match `:cameraId` with `req.params.cameraId = 'summary'`. The database query would attempt `WHERE camera_id = 'summary'`, resulting in a 404 Not Found error instead of calling the summary aggregation handler.

> **Q2: Why does `initializeDBAndServer()` use `async/await` rather than calling `app.listen()` immediately?**  
> **A:** Database connection and table creation are asynchronous operations. If `app.listen()` started before `initializeDB()` resolved, early incoming HTTP requests would fail with uninitialized database references. Synchronizing startup guarantees zero downtime or runtime crashes.

---

### Member 2: Database Management

#### Assigned Files
- `database/database.js`

#### Core Responsibilities
1. **SQLite Database Initialization:** Configure asynchronous connection to `database/lensLab.db` using the `sqlite` wrapper around `sqlite3.Database`.
2. **Referential Integrity Enforcement:** Execute `PRAGMA foreign_keys = ON;` on every connection because SQLite disables foreign key constraints by default for backward compatibility.
3. **Relational Schema Definition:** Create tables using `CREATE TABLE IF NOT EXISTS`:
   - `photographers`: `photographer_id` (PK), `name`, `phone`, `email`.
   - `cameras`: `camera_id` (PK), `name`, `kind`.
   - `rentals`: `rental_id` (PK), `photographer_id` (FK), `camera_id` (FK), `rental_date`, `return_date`.
4. **Clean Slate Guarantee:** Maintain an initially empty `cameras` table to pass Twist Test 3 without hardcoded seed records.
5. **Singleton Accessor:** Export `getDB()` to allow endpoint handlers to obtain the active database instance safely without re-opening database file handles.

#### Key Functions & Code Artifacts
- `database/database.js`: `initializeDB()`, `getDB()`, SQLite schema SQL definitions.

#### Viva Preparation & Model Q&A
> **Q1: What happens if `PRAGMA foreign_keys = ON;` is omitted in SQLite?**  
> **A:** SQLite will accept `INSERT INTO rentals` with nonexistent `photographer_id` or `camera_id` values, and will allow `DELETE FROM cameras` even if the camera is currently referenced in an active rental. Enabling this pragma guarantees database-level referential integrity.

> **Q2: Why use `getDB()` as an exported accessor function instead of directly exporting the `db` variable?**  
> **A:** `db` starts as `null` while asynchronous connection is established. Exporting `getDB()` ensures that if an endpoint accidentally executes before initialization, an explicit, informative error (`"Database not initialized"`) is thrown rather than a cryptic `null pointer` crash.

---

### Member 3: REST API Development

#### Assigned Files
- `endpoints.js`

#### Core Responsibilities
1. **Camera CRUD Operations:**
   - `getAllCameras`: Fetch all cameras or route to kind search.
   - `getCameraById`: Retrieve a single camera record by `camera_id` or return HTTP 404.
   - `addCamera`: Insert new camera and return HTTP 201 with `cameraId`.
   - `updateCamera`: Update existing camera fields or return HTTP 404 if not found.
   - `deleteCamera`: Remove camera by ID; intercept SQLite foreign key constraint failures and return HTTP 409 Conflict.
2. **Photographer Endpoints:**
   - `getAllPhotographers`: Return array of all registered photographers.
   - `addPhotographer`: Validate name/phone and persist record with HTTP 201.
3. **Rental Booking & Validation:**
   - `addRental`: Verify existence of referenced `photographer_id` and `camera_id` prior to insertion, returning HTTP 400 if invalid.
4. **Multi-Table Relational JOIN:**
   - `getRentals`: Execute SQL `INNER JOIN` combining `rentals`, `photographers`, and `cameras` to project `rental_id`, `photographer_name`, `camera_name`, `kind`, `rental_date`, and `return_date`.

#### Key Functions & Code Artifacts
- `endpoints.js`: `getAllCameras`, `getCameraById`, `addCamera`, `updateCamera`, `deleteCamera`, `getAllPhotographers`, `addPhotographer`, `addRental`, `getRentals`.

#### Viva Preparation & Model Q&A
> **Q1: How does the `getRentals` query combine data across three tables?**  
> **A:** It uses two `INNER JOIN` clauses:
> ```sql
> SELECT rentals.rental_id, photographers.name AS photographer_name,
>        cameras.name AS camera_name, cameras.kind,
>        rentals.rental_date, rentals.return_date
> FROM rentals
> INNER JOIN photographers ON rentals.photographer_id = photographers.photographer_id
> INNER JOIN cameras ON rentals.camera_id = cameras.camera_id;
> ```
> This matches foreign keys against primary keys, replacing numeric IDs with human-readable photographer and camera names in the response.

> **Q2: How does `deleteCamera` handle cameras with active rental history?**  
> **A:** When attempting to delete a camera whose `camera_id` exists in `rentals`, SQLite throws an `SQLITE_CONSTRAINT` error. The `catch` block inspects `error.code` or message content and responds with HTTP 409 Conflict:
> `{ "error": "Camera cannot be deleted because it is associated with a rental" }`.

---

### Member 4: Validation, Search & Special Requirements

#### Assigned Files
- `validation.js`
- `summary.js`

#### Core Responsibilities
1. **Request Validation Middleware:** Create `validateCamera` middleware for `POST /cameras` and `PUT /cameras/:cameraId`. Check that `name` and `kind` are non-empty strings, returning HTTP 400 Bad Request on failure.
2. **Parameterized Query Search:** Implement `searchCameras` to filter cameras by `kind` (`GET /cameras?kind=DSLR`). Use parameterized SQL (`WHERE kind = ?;`, `[kind]`) to guarantee complete immunity against SQL injection.
3. **Empty Match Handling:** Return HTTP 200 with an empty array `[]` when a requested camera kind (e.g. `?kind=Vintage`) has no matches.
4. **Special Twist Aggregation:** Implement `getCameraSummary` in `summary.js` using SQLite `GROUP BY` to aggregate inventory counts:
   ```sql
   SELECT kind, COUNT(*) AS count 
   FROM cameras 
   GROUP BY kind;
   ```
5. **Twist Test Compliance:** Satisfy all three twist test criteria:
   - Test 1: Insert cameras in multiple kinds (`DSLR`, `Mirrorless`).
   - Test 2: Execute summary and return aggregated counts per kind.
   - Test 3: Return empty array `[]` with status 200 when camera table is empty.

#### Key Functions & Code Artifacts
- `validation.js`: `validateCamera(req, res, next)`, `searchCameras(req, res)`
- `summary.js`: `getCameraSummary(req, res)`

#### Viva Preparation & Model Q&A
> **Q1: Why is parameterized querying (`WHERE kind = ?`) mandatory for camera search?**  
> **A:** If user input was directly concatenated into the SQL string (e.g., `'... WHERE kind = ' + kind`), an attacker could pass `' OR 1=1 --` to expose, alter, or drop entire database tables. Parameterized inputs are treated strictly as data literals by the SQLite parser.

> **Q2: Why execute `GROUP BY` inside SQLite rather than grouping results in Node.js with `Array.prototype.reduce()`?**  
> **A:** Pushing aggregation to the database engine optimizes performance and memory usage. SQLite groups records in C-level optimized routines and only transmits the aggregated rows across the process boundary. If the table is empty, SQLite naturally returns zero rows, fulfilling Twist Test 3 without additional JavaScript logic.

---

### Member 5: API Testing & Documentation

#### Assigned Files
- `postman/LensLab.postman_collection.json`
- `api.http`
- `README.md`
- `screenshots/`
- `MEMBER_CONTRIBUTION_GUIDE.md`

#### Core Responsibilities
1. **Postman Collection Design:** Create a comprehensive, production-ready Postman collection (v2.1.0) structured into 5 functional test folders:
   - `1. Twist Tests (Summary by Kind)`
   - `2. Camera Operations (CRUD & Search)`
   - `3. Validation & Error Handling`
   - `4. Photographer Operations`
   - `5. Rental Operations (JOIN & Foreign Keys)`
2. **Automated Assertion Scripts:** Embed pre-request scripts, tests, and response status assertions (`pm.response.to.have.status(...)`) for all 41 test scenarios.
3. **VS Code REST Client Collection:** Author and maintain `api.http` allowing developers without Postman to test every route directly from their IDE.
4. **Documentation & Diagrams:** Create publication-grade repository documentation, Mermaid System Architecture Flowcharts, Mermaid ER Diagrams, HTTP status code matrices, and viva guides.
5. **Visual Verification Evidence:** Run automated test executions, verify 100% pass rate (41/41 passed), and capture authentic screenshots in `screenshots/`.

#### Key Functions & Code Artifacts
- `postman/LensLab.postman_collection.json`: Collection schema v2.1.0 with environment variables and assertions.
- `api.http`: 187-line runnable HTTP script with environment variables and sample payloads.
- `README.md`: Exhaustive 30-section technical documentation.
- `screenshots/`: 9 authentic test execution screenshots.

#### Viva Preparation & Model Q&A
> **Q1: How does the Postman collection verify the three Twist Tests in sequence?**  
> **A:** Folder 1 executes:
> 1. Initial `GET /cameras/summary` verifying `[]` with status 200 (Test 3 initial).
> 2. `POST /cameras` inserting 2 DSLR cameras and 1 Mirrorless camera (Test 1).
> 3. `GET /cameras/summary` asserting counts: `DSLR: 2`, `Mirrorless: 1` (Test 2).
> 4. `DELETE /cameras/:id` teardown deleting all 3 cameras.
> 5. Final `GET /cameras/summary` verifying return to `[]` with status 200 (Test 3 verified).

> **Q2: What is the purpose of providing both `api.http` and Postman collections?**  
> **A:** Postman provides a visual UI, environment management, and automated test runners ideal for demonstrations and QA teams. `api.http` provides a lightweight, Git-versionable, zero-dependency alternative that runs directly inside VS Code or JetBrains IDEs without requiring external software.

---

## 4. Integration & Execution Verification

Before submitting or presenting, verify the complete integrated application:

```powershell
# 1. Clone repository
git clone https://github.com/Nithish-2007-web/Lens-Lab-Studio.git
cd Lens-Lab-Studio

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Verification Checklist
- [x] Server boots and prints: `Server running at http://localhost:3000/`
- [x] Database initializes `photographers`, `cameras`, and `rentals` tables
- [x] `PRAGMA foreign_keys = ON;` is enforced
- [x] `GET /cameras/summary` returns `[]` on clean startup
- [x] Validation middleware blocks empty requests with HTTP 400
- [x] Foreign key conflict blocks camera deletion with HTTP 409
- [x] All 41 Postman test cases pass with 0 failures
- [x] All files adhere strictly to the 5-member allocation model
