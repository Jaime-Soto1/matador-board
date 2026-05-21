# Matador Board

Matador Board is a full-stack Kanban-style document workflow application built with React, TypeScript, Express, and MySQL. The project was designed for a university-style approval process where users can manage boards, organize tasks, upload documents, and track document approval statuses.

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

**Frontend**
- React
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- dnd-kit

**Backend**
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
