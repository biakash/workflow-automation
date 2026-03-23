# FlowForge Workflow Engine

## Executive Summary
FlowForge is a robust, dynamic, graph-based workflow automation platform designed to digitize, execute, and monitor complex business processes. 

Built with scalability and flexibility in mind, FlowForge allows organizations to replace hardcoded business logic with visual workflows. It empowers administrators to design custom forms, define automated decision-making rules, and set up multi-tier, role-based approval sequences—all without writing additional code. It serves as a lightweight alternative to enterprise solutions like Camunda or Appian.

## Core Capabilities
- **Visual Workflow Builder**: An intuitive, node-based canvas (powered by React Flow) for designing process maps.
- **Dynamic Form Generation**: Workflows define their own custom input schemas, which automatically render client-side forms for user application submission.
- **Graph Execution Engine**: A backend traversal engine that evaluates custom condition rules, triggers automated tasks, and progresses workflow branches asynchronously.
- **Human-in-the-Loop Approvals**: Execute pauses to await manager, finance, or specialized role reviews, providing comments and manual overrides.
- **Role-Based Access Control (RBAC)**: Distinct dashboards, queues, and permissions tailored for Employees, Managers, Finance, and System Admins.
- **Dynamic Notifications**: Rule-based notification targeting configured at the workflow level to alert requesters or specific corporate roles.
- **Live Execution Tracking**: Real-time progress bars and step-by-step audit trails visualised for both requesters and approvers.

## How It Works (The Lifecycle)

To fully understand FlowForge, it is best to look at the lifecycle of a single workflow:

1. **Design (Admin)**: An Administrator creates a new Workflow via the visual builder. They drag and drop nodes (Start, Input, Condition, Decision, Action, Notification, End), connect them with edges, configure the required dynamic form fields, and publish the workflow.
2. **Submission (User/Employee)**: A User views the available active workflows, selects one, and fills out the dynamically generated form. 
3. **Execution (System)**: The backend `graphEngine` receives the form data and begins traversing the graph. 
   - It evaluates **Condition Nodes** (e.g., `if loanAmount > 10000`).
   - If human approval is needed, it stops at a **Task Node** and assigns it to a specific role (e.g., `Manager`).
4. **Approval (Manager/Finance)**: A user with the assigned role logs in, evaluates the request in their Approval Queue, and clicks "Approve" or "Reject".
5. **Completion**: The graph resumes traversal. It may trigger **Notification Nodes** (sending an alert to the requester) and finally reaches the **End Node**, marking the execution as fully resolved.

## Demo Credentials
To explore the role-based features and approval routing across different dashboards, use the following pre-configured demo accounts to log in:
- **Admin**: `admin@gmail.com` / `admin123`
- **Manager**: `manager@company.com` / `password123`
- **Employee**: `employee@company.com` / `password123`
- **Finance**: `finance@company.com` / `password123`

## Tech Stack
- **Frontend**: React.js, React Router, React Flow, Vanilla CSS, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites
- Node.js (v18.x or later recommended)
- MongoDB instance (Atlas or local)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## API Endpoints Summary

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/me`
- **Workflows**: `GET /api/workflows`, `POST /api/workflows`, `POST /api/workflows/:id/execute`
- **Executions & Tasks**: `GET /api/executions/:id`, `GET /api/tasks`, `POST /api/executions/:id/action`

## Folder Structure
```text
├── backend/
│   ├── controllers/      # Route handlers and business logic
│   ├── middleware/       # JWT and RBAC guards
│   ├── models/           # Mongoose schemas (Execution, Workflow, Task)
│   ├── routes/           # Express API endpoints
│   ├── utils/            # Condition evaluation and graph traversal engine
│   └── server.js         # Application entry point
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client instance
│   │   ├── components/   # Reusable UI elements and Graph Nodes
│   │   ├── context/      # Authentication state
│   │   ├── pages/        # Dashboard views and Authentication screens
│   │   ├── App.jsx       # Root router component
│   │   └── main.jsx      # React DOM hydration
```
## 🎥 Demo Video Link
https://drive.google.com/file/d/1PN5YRrd7gjFFE9JBmSV2uI87gx-0kHJk/view?usp=drive_link



## Future Improvements
- **Webhook Integration**: Allow external systems to trigger workflow inputs via APIs.
- **Third-Party Notifications**: Add automated Slack, Email, and Microsoft Teams nodes.
- **Parallel Traversal**: Expand the `graphEngine` to handle asynchronous split/join branches.
- **Analytics Dashboard**: Implement system-wide metrics to identify task completion bottlenecks.
