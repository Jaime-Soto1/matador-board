# Matador Board

Matador Board is a full-stack Kanban-style document workflow application built with React, TypeScript, Express, and MySQL. The project was designed for a university-style approval process where users can manage boards, organize tasks, upload documents, invite members, and track document approval statuses.

## Project Purpose

Matador Board was designed as a senior design-style workflow application for managing shared task boards and document approval processes. The goal was to create a system where users could organize tasks, collaborate through group boards, upload documents, and track approval statuses in one place.

## My Role

For this project, I helped organize the team's workflow, coordinate project responsibilities, and keep development moving toward the final application goals. I contributed to the database design and SQL work, including helping structure tables for users, boards, documents, columns, tasks, invites, and group board functionality.

I also supported backend development by helping troubleshoot API routes, database connection issues, and data persistence problems between the React frontend, Express backend, and MySQL database. My work focused on making sure the system could save and retrieve board data, support document workflow features, and function reliably for returning users.

## Features

- Kanban board interface with draggable columns and tasks
- Group board management
- Board invitation workflow
- User role handling for student/user and faculty-style permissions
- Document upload system
- Document status tracking: Pending, Approved, and Rejected
- Document list with file preview support
- React Router page navigation
- Redux Toolkit state management
- Express backend routes
- MySQL database integration

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- dnd-kit

### Backend

- Node.js
- Express
- TypeScript
- MySQL
- Multer for file uploads

## Project Structure

```text
src/
  components/
    KanbanBoard.tsx
    KanbanColumn.tsx
    KanbanTaskItem.tsx
    Documents.tsx
    DocumentList.tsx
    Navbar.tsx

  pages/
    BoardView.tsx
    GroupManagement.tsx
    MyBoards.tsx

  server/
    server.ts
    boardRoutes.ts
    db.ts

  store/
    kanbanSlice.ts
    index.ts

  util/
    kanbanUtils.ts
    reduxHooks.ts
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Jaime-Soto1/matador-board.git
cd matador-board
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root directory with your local MySQL configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=matadorboard
```

Run the project:

```bash
npm run dev
```

Note: Full backend/database functionality requires a local MySQL database and matching environment variables.

This project was built as a senior design-style full-stack application focused on task management, document workflow, role-based access, group collaboration, and database-backed persistence.
