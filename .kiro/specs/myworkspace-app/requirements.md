# Requirements Document

## Introduction

MyWorkspace is a personal productivity web application built with React, TypeScript, Vite, and AWS Amplify Gen 2. It provides authenticated users with a unified workspace containing three modules: Task Management (CRUD todos with state tracking and ordering), Data Processing (trigger and monitor async analysis jobs via REST API), and Planning & Analytics (currently a placeholder for future features). The application uses Cloudscape Design System for UI components and AWS Cognito for authentication.

## Glossary

- **App**: The top-level MyWorkspace React application.
- **Authenticator**: The AWS Amplify UI component that handles user sign-in, sign-up, and sign-out via AWS Cognito.
- **Task**: A unit of work stored in the Amplify Data (DynamoDB) backend with fields: `id`, `content`, `state`, `order`, `createdAt`, `updatedAt`.
- **Task_Manager**: The Task Management module responsible for creating, reading, updating, and deleting Tasks.
- **Todo_Store**: The AWS Amplify Data backend (AppSync + DynamoDB) that persists Task records.
- **State**: The lifecycle status of a Task — one of `not-started`, `in-progress`, or `completed`.
- **Order**: An integer field on a Task that determines its display position in the task list.
- **UTC_Mode**: A per-cell toggle that switches a date/time display between the user's local timezone and UTC.
- **Data_Processor**: The Data Processing module responsible for triggering and monitoring async analysis jobs.
- **API_Client**: The singleton HTTP client (`apiClient`) that wraps `fetch` with retry logic and JSON parsing.
- **Analysis_Job**: An async AWS Step Functions execution identified by an `executionId`, triggered via the REST API backed by a Java 17 Trigger Lambda.
- **Process_Type**: The processing strategy for an Analysis Job — one of `parallel`, `loop`, or `whole`. `parallel` runs items concurrently via a Step Functions Map state; `loop` runs items sequentially (maxConcurrency=1); `whole` passes the entire payload to a single Python Lambda invocation.
- **Execution_Status**: The current state of an Analysis Job as reported by the check endpoint (Java 17 Check Lambda) — one of `RUNNING`, `SUCCEEDED`, or `FAILED`.
- **Step_Functions**: AWS Step Functions state machine (`ProcessAndReportJob`) that orchestrates the Lambda execution with a 5-minute timeout.
- **Trigger_Lambda**: Java 17 Lambda (`TriggerHandler`) that validates the request, generates a UUID execution name, and calls `StartExecution` on the state machine.
- **Check_Lambda**: Java 17 Lambda (`CheckHandler`) that calls `DescribeExecution` and returns status, output, and error details.
- **Processing_Lambda**: Python 3.11 Lambda that processes individual items within the Step Functions Map or whole-mode invocation.
- **API_Call_History**: An in-memory, session-scoped log of all HTTP requests and responses made by the Data_Processor.
- **Planning_Analytics**: The Planning & Analytics module, currently an empty shell reserved for future features.
- **Side_Navigation**: The Cloudscape `SideNavigation` component that allows users to switch between modules.
- **Top_Navigation**: The Cloudscape `TopNavigation` component that displays the app identity and user utilities.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to sign in with my credentials, so that my data is private and only accessible to me.

#### Acceptance Criteria

1. WHEN a user visits the App without an active session, THE Authenticator SHALL display a sign-in form.
2. WHEN a user submits valid credentials, THE Authenticator SHALL establish an authenticated session and render the main App layout.
3. WHEN a user clicks the Logout button in the Top_Navigation, THE Authenticator SHALL terminate the session and return the user to the sign-in form.
4. WHILE a user is authenticated, THE App SHALL display the user's login ID in the Top_Navigation utility bar.
5. IF authentication fails due to invalid credentials, THEN THE Authenticator SHALL display an error message to the user.

---

### Requirement 2: Application Shell and Navigation

**User Story:** As a user, I want a consistent navigation shell, so that I can move between modules without losing context.

#### Acceptance Criteria

1. THE App SHALL render a Top_Navigation bar with the application title "MyWorkspace" and a user profile utility at all times while authenticated.
2. THE App SHALL render a collapsible Side_Navigation panel listing the three modules: Task Management, Planning & Analytics, and Data Processing.
3. WHEN a user selects a module link in the Side_Navigation, THE App SHALL render the corresponding module in the main content area.
4. WHEN a user selects the "MyWorkspace" header link in the Side_Navigation, THE App SHALL render the home welcome screen.
5. WHEN a user follows a breadcrumb link back to "MyWorkspace", THE App SHALL navigate to the home screen.
6. THE App SHALL render a footer with copyright text below the main content area at all times while authenticated.

---

### Requirement 3: Task Creation

**User Story:** As a user, I want to create new tasks, so that I can track work I need to do.

#### Acceptance Criteria

1. WHEN a user clicks the "Create Task" button, THE Task_Manager SHALL display a modal dialog with a multi-line text input for task content.
2. WHEN a user submits the modal with non-empty content, THE Task_Manager SHALL persist a new Task to the Todo_Store with `state` set to `not-started` and `order` set to one greater than the current maximum order value.
3. WHEN a user submits the modal with empty or whitespace-only content, THE Task_Manager SHALL not create a Task and SHALL keep the modal open.
4. WHEN a user dismisses the modal via the Cancel button or the close control, THE Task_Manager SHALL discard the input and close the modal without creating a Task.

---

### Requirement 4: Task Display and Filtering

**User Story:** As a user, I want to view and filter my tasks, so that I can focus on relevant work.

#### Acceptance Criteria

1. THE Task_Manager SHALL display all Tasks belonging to the authenticated user in an AG Grid table, sorted ascending by the `order` field.
2. THE Task_Manager SHALL render the following columns: order number (`#`), content, state, created timestamp, updated timestamp, and an actions column.
3. WHEN a user selects a filter option from the filter dropdown, THE Task_Manager SHALL display only Tasks whose `state` matches the selected filter value.
4. THE Task_Manager SHALL support filter values of: All, Not Started, In Progress, and Completed.
5. THE Task_Manager SHALL paginate the task list with a default page size of 10 rows.
6. WHEN the Todo_Store emits a real-time update via `observeQuery`, THE Task_Manager SHALL re-render the task list to reflect the latest data without requiring a page reload.

---

### Requirement 5: Task State Management

**User Story:** As a user, I want to cycle a task through its lifecycle states, so that I can track progress.

#### Acceptance Criteria

1. WHEN a user clicks the state badge of a Task with state `not-started`, THE Task_Manager SHALL update the Task's `state` to `in-progress` in the Todo_Store.
2. WHEN a user clicks the state badge of a Task with state `in-progress`, THE Task_Manager SHALL update the Task's `state` to `completed` in the Todo_Store.
3. WHEN a user clicks the state badge of a Task with state `completed`, THE Task_Manager SHALL update the Task's `state` to `not-started` in the Todo_Store.
4. THE Task_Manager SHALL render the state badge with distinct visual styling for each state: grey for `not-started`, yellow for `in-progress`, and green for `completed`.

---

### Requirement 6: Task Editing

**User Story:** As a user, I want to edit the content of an existing task, so that I can correct or update its description.

#### Acceptance Criteria

1. WHEN a user double-clicks the content cell of a Task row, THE Task_Manager SHALL open the edit modal pre-populated with the Task's current content.
2. WHEN a user saves the edit modal with non-empty content, THE Task_Manager SHALL update the Task's `content` field in the Todo_Store.
3. WHEN a user saves the edit modal with empty or whitespace-only content, THE Task_Manager SHALL not update the Task and SHALL keep the modal open.
4. WHEN a user dismisses the edit modal, THE Task_Manager SHALL discard changes and close the modal without modifying the Task.

---

### Requirement 7: Task Ordering

**User Story:** As a user, I want to manually set the order of tasks, so that I can prioritize my work.

#### Acceptance Criteria

1. THE Task_Manager SHALL display each Task's `order` value in the `#` column as an editable cell.
2. WHEN a user edits the `#` cell and enters a valid integer, THE Task_Manager SHALL persist the new `order` value to the Todo_Store and re-sort the displayed list.
3. IF a Task in the Todo_Store has a null `order` value, THEN THE Task_Manager SHALL assign it a sequential `order` value on initial load to ensure all Tasks have a defined order.
4. THE Task_Manager SHALL sort Tasks with a null `order` value to the end of the list during display.

---

### Requirement 8: Task Deletion

**User Story:** As a user, I want to delete tasks, so that I can remove work that is no longer relevant.

#### Acceptance Criteria

1. WHEN a user clicks the delete icon in the Actions column of a Task row, THE Task_Manager SHALL permanently delete the Task from the Todo_Store.

---

### Requirement 9: Timezone Display Toggle

**User Story:** As a user, I want to toggle timestamps between local time and UTC, so that I can interpret dates in the context I need.

#### Acceptance Criteria

1. THE Task_Manager SHALL display the `createdAt` and `updatedAt` timestamps for each Task in the user's local timezone by default, with the timezone abbreviation appended.
2. WHEN a user clicks a timestamp cell, THE Task_Manager SHALL toggle that specific cell's display between local timezone and UTC.
3. WHEN a timestamp is displayed in UTC, THE Task_Manager SHALL append the string "UTC" to the formatted date.
4. THE Task_Manager SHALL maintain the UTC/local toggle state independently for each timestamp cell across the `createdAt` and `updatedAt` columns.

---

### Requirement 10: Trigger Analysis Job

**User Story:** As a user, I want to trigger an async analysis job with a list of items, so that I can process data through the backend pipeline.

#### Acceptance Criteria

1. WHEN a user clicks "Trigger Analysis" with a non-empty items list, THE Data_Processor SHALL send a POST request to the `trigger` endpoint via the API_Client with the `processType`, `items`, and optional `maxConcurrency` fields.
2. WHEN a user clicks "Trigger Analysis" with an empty items input, THE Data_Processor SHALL display an error notification and SHALL NOT send a request to the API.
3. THE Data_Processor SHALL accept items entered as comma-separated values or one item per line in the items textarea.
4. THE Data_Processor SHALL support Process_Type values of `parallel`, `loop`, and `whole`, selectable via a dropdown:
   - `parallel`: Step Functions Map state processes items concurrently (maxConcurrency defaults to item count).
   - `loop`: Step Functions Map state processes items sequentially (maxConcurrency=1).
   - `whole`: Single Python Lambda invocation receives the entire items payload.
5. WHERE a user provides a valid positive integer in the Max Concurrency field, THE Data_Processor SHALL include the `maxConcurrency` field in the trigger request payload.
6. IF the trigger request fails or returns no `executionId`, THEN THE Data_Processor SHALL display an error notification with the failure reason.
7. WHEN the backend returns HTTP 400 due to an invalid `processType`, missing fields, or empty item strings, THE Data_Processor SHALL display the error message from the response.

---

### Requirement 11: Monitor Analysis Job Execution

**User Story:** As a user, I want to see the real-time status of a triggered analysis job, so that I know when it completes or fails.

#### Acceptance Criteria

1. WHEN a trigger request succeeds and returns an `executionId`, THE Data_Processor SHALL begin polling the `check` endpoint with the `executionId` at 2-second intervals.
2. WHILE an Analysis_Job has Execution_Status `RUNNING`, THE Data_Processor SHALL display an in-progress status indicator with the message "Execution in progress...".
3. WHEN an Analysis_Job reaches Execution_Status `SUCCEEDED`, THE Data_Processor SHALL stop polling, display a success notification, and render the job output as formatted JSON.
4. WHEN an Analysis_Job reaches Execution_Status `FAILED`, THE Data_Processor SHALL stop polling and display an error notification with the failure cause from the `cause` field in the check response.
5. IF a status check request fails, THEN THE Data_Processor SHALL stop polling and display an error notification.
6. THE Data_Processor SHALL poll the check endpoint immediately upon receiving the `executionId` before starting the interval-based polling.
7. THE check response SHALL include `executionId`, `status`, `output` (on success), `cause` and `error` (on failure), `startDate`, and `stopDate` fields.

---

### Requirement 12: API Call History

**User Story:** As a user, I want to see a log of API calls made during a session, so that I can inspect request and response payloads for debugging.

#### Acceptance Criteria

1. THE Data_Processor SHALL display an API Call History panel alongside the main processing form.
2. WHEN an API request is made to the `trigger` or `check` endpoint, THE Data_Processor SHALL prepend a new entry to the API_Call_History containing the endpoint, HTTP method, request payload, response payload, and timestamp.
3. THE Data_Processor SHALL display the most recent API call at the top of the API_Call_History panel.
4. THE Data_Processor SHALL render each history entry with collapsible sections for the request and response payloads formatted as JSON.
5. WHEN a user clicks the clear button in the API_Call_History panel, THE Data_Processor SHALL remove all entries from the history.
6. WHEN a user clicks "Trigger Analysis", THE Data_Processor SHALL clear the existing API_Call_History before recording new calls for the new job.

---

### Requirement 13: HTTP API Client

**User Story:** As a developer, I want a reusable HTTP client, so that all API calls are made consistently with error handling and retry support.

#### Acceptance Criteria

1. THE API_Client SHALL support GET, POST, PUT, DELETE, and PATCH HTTP methods.
2. THE API_Client SHALL set the `Content-Type: application/json` header on all requests by default.
3. WHEN a response body is valid JSON, THE API_Client SHALL parse and return it as the response data.
4. IF a response body is not valid JSON, THEN THE API_Client SHALL return the raw text wrapped in a `{ text }` object.
5. WHEN a request fails and the `retries` option is greater than zero, THE API_Client SHALL retry the request up to the specified number of times with a configurable delay between attempts.
6. IF a network error occurs, THEN THE API_Client SHALL return a response with `success: false`, `status: 0`, and the error message.
7. THE API_Client SHALL expose a singleton instance (`apiClient`) for use across the application.

---

### Requirement 14: Planning & Analytics Module (Placeholder)

**User Story:** As a user, I want to navigate to the Planning & Analytics module, so that I can access future planning features when they become available.

#### Acceptance Criteria

1. THE Planning_Analytics module SHALL render a container with the header "Planning & Analytics" when navigated to.
2. THE Planning_Analytics module SHALL render a breadcrumb trail showing "MyWorkspace > Planning & Analytics".
3. WHEN a user follows the "MyWorkspace" breadcrumb in the Planning_Analytics module, THE App SHALL navigate to the home screen.

---

### Requirement 15: Data Ownership and Authorization

**User Story:** As a user, I want my tasks to be private, so that other users cannot read or modify my data.

#### Acceptance Criteria

1. THE Todo_Store SHALL enforce owner-based authorization so that each Task is readable and writable only by the user who created it.
2. WHILE a user is authenticated, THE Task_Manager SHALL only retrieve Tasks owned by the currently authenticated user.
