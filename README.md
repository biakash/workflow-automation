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

## Output Screenshot
<img width="1920" height="965" alt="Image" src="https://github.com/user-attachments/assets/8e3bef6a-3d21-4c2f-a0fe-74497f626d7a" />
<img width="1919" height="960" alt="Image" src="https://github.com/user-attachments/assets/4b05f138-494d-45db-a725-cd55d33222de" />
<img width="1913" height="959" alt="Image" src="https://github.com/user-attachments/assets/3d44c28e-b58e-4340-b9a3-ea13d615f305" />
<img width="1920" height="964" alt="Image" src="https://github.com/user-attachments/assets/03f157d6-73d3-4ff0-841d-8df109b0f835" />
<img width="1920" height="966" alt="Image" src="https://github.com/user-attachments/assets/5f87fdbf-ea69-4b67-b962-b517a05e3db2" />
<img width="1910" height="952" alt="Image" src="https://github.com/user-attachments/assets/ea2d94e1-ce93-4f2c-b2e0-6d70d78c298f" />
<img width="1920" height="960" alt="Image" src="https://github.com/user-attachments/assets/f7ce12d8-f40e-44bd-a778-45ca61f79be8" />
<img width="1915" height="959" alt="Image" src="https://github.com/user-attachments/assets/8eb52f82-9c28-4c96-b303-71f4e39b6723" />
<img width="1915" height="958" alt="Image" src="https://github.com/user-attachments/assets/4f89ef60-6e56-4657-979c-c459815619a1" />
<img width="1916" height="965" alt="Image" src="https://github.com/user-attachments/assets/1a3313e9-29cf-4926-91e0-3a907369200b" />
<img width="1920" height="965" alt="Image" src="https://github.com/user-attachments/assets/16aa13d5-c12b-4900-aaf1-c6c14aa07394" />
<img width="1913" height="968" alt="Image" src="https://github.com/user-attachments/assets/7cae6b47-f49d-4e80-8579-d3524baf2722" />
<img width="1920" height="963" alt="Image" src="https://github.com/user-attachments/assets/5d34481f-1a69-45ac-ab91-1e547fb2dd00" />
<img width="1920" height="967" alt="Image" src="https://github.com/user-attachments/assets/772a2f0a-6770-423c-82d4-3da5c667f9c9" />
<img width="1920" height="961" alt="Image" src="https://github.com/user-attachments/assets/e09379b8-8f52-4cb3-8c91-e5415d9e4bda" />
<img width="1920" height="961" alt="Image" src="https://github.com/user-attachments/assets/bd712b26-11e5-497c-8409-53c4d9c7a696" />
<img width="1920" height="967" alt="Image" src="https://github.com/user-attachments/assets/bba99780-e5e8-4d5f-be5a-276ad9dd6180" />
<img width="1912" height="965" alt="Image" src="https://github.com/user-attachments/assets/3e0c200b-1e42-433e-87aa-f8d60ec36604" />
<img width="1920" height="968" alt="Image" src="https://github.com/user-attachments/assets/e927d33a-acd8-4c87-8171-7ee550355252" />
<img width="1918" height="969" alt="Image" src="https://github.com/user-attachments/assets/cc9ed539-6a13-43ff-96ca-ca15b6139831" />
<img width="1918" height="970" alt="Image" src="https://github.com/user-attachments/assets/7a58bd53-9cd4-4c4f-b501-0de302b6e28c" />
<img width="1920" height="970" alt="Image" src="https://github.com/user-attachments/assets/c27872f5-37c9-4b5b-b185-87e8fcaec9b8" />

## Future Improvements
- **Webhook Integration**: Allow external systems to trigger workflow inputs via APIs.
- **Third-Party Notifications**: Add automated Slack, Email, and Microsoft Teams nodes.
- **Parallel Traversal**: Expand the `graphEngine` to handle asynchronous split/join branches.
- **Analytics Dashboard**: Implement system-wide metrics to identify task completion bottlenecks.
