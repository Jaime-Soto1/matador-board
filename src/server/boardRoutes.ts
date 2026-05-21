import express, { Request, Response } from "express";
import pool from "./db";

const router = express.Router();

router.get("/default", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ success: false, message: "Missing or invalid email" });
    return;
  }

  try {
    const [userRows]: any[] = await pool.promise().query(
      "SELECT * FROM users WHERE email = ?", [email]
    );

    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const userId = userRows[0].id;

    const [boards]: any[] = await pool.promise().query(
      "SELECT * FROM group_boards WHERE user_id = ? LIMIT 1", [userId]
    );

    let boardId: number;

    if (boards.length > 0) {
      boardId = boards[0].id;
    } else {
      const [createBoardRes]: any = await pool.promise().query(
        "INSERT INTO group_boards (name, user_id, created_at) VALUES (?, ?, NOW())",
        ["My Board", userId]
      );

      boardId = createBoardRes.insertId;

      await pool.promise().query(
        "INSERT INTO group_board_users (board_id, user_id, permission) VALUES (?, ?, ?)",
        [boardId, userId, "editor"]
      );

      const defaultCols = ["Todo", "In Progress", "Done"];
      for (const name of defaultCols) {
        await pool.promise().query(
          "INSERT INTO columns (board_id, name) VALUES (?, ?)", [boardId, name]
        );
      }
    }

    const [columns]: any[] = await pool
      .promise()
      .query("SELECT * FROM columns WHERE board_id = ?", [boardId]);

    const results = [];

    for (const col of columns) {
      const [tasks]: any[] = await pool
        .promise()
        .query("SELECT * FROM tasks WHERE column_id = ?", [col.id]);
      results.push({ ...col, tasks });
    }

    res.json({ success: true, boardId, columns: results });
  } catch (err) {
    console.error("Error in /default route:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 📄 Get All Boards for a User
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.query.userId;

  if (!userId) {
    res.status(400).json({ success: false, message: "Missing userId" });
    return;
  }

  try {
    const [rows]: any[] = await pool.promise().query(
      `SELECT gb.id, gb.name, gb.created_at
       FROM group_boards gb
       JOIN group_board_users gbu ON gb.id = gbu.board_id
       WHERE gbu.user_id = ?`, [userId]
    );

    res.json({ success: true, boards: rows });
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    res.status(500).json({ success: false, message: "Failed to fetch boards" });
  }
});

// 🔎 Get Columns + Tasks for a Board
router.get("/:id/columns", async (req: Request, res: Response): Promise<void> => {
  const boardId = req.params.id;
  try {
    const [columns]: any[] = await pool
      .promise()
      .query("SELECT * FROM columns WHERE board_id = ?", [boardId]);

    const results = [];
    for (const col of columns) {
      const [tasks]: any[] = await pool
        .promise()
        .query("SELECT * FROM tasks WHERE column_id = ?", [col.id]);
      results.push({ ...col, tasks });
    }

    res.json({ columns: results });
  } catch (error) {
    console.error("Error fetching board columns:", error);
    res.status(500).json({ message: "Failed to fetch board columns" });
  }
});

// 👥 Get Members of a Board
router.get("/:id/members", async (req: Request, res: Response): Promise<void> => {
  const boardId = req.params.id;
  try {
    const [rows]: any[] = await pool.promise().query(
      `SELECT u.email, gbu.permission
       FROM group_board_users gbu
       JOIN users u ON gbu.user_id = u.id
       WHERE gbu.board_id = ?`, [boardId]
    );

    res.json({ members: rows });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// ➕ Add Column to Board
router.post("/columns", async (req: Request, res: Response): Promise<void> => {
  const { boardId, name } = req.body;

  if (!boardId || !name) {
    res.status(400).json({ message: "Missing boardId or name" });
    return;
  }

  try {
    const [result]: any = await pool
      .promise()
      .query("INSERT INTO columns (board_id, name) VALUES (?, ?)", [boardId, name]);

    const [newColRows]: any[] = await pool
      .promise()
      .query("SELECT * FROM columns WHERE id = ?", [result.insertId]);

    const column = newColRows[0];
    column.tasks = [];

    res.status(201).json({ column });
  } catch (error) {
    console.error("Error adding column:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Add Task to Column
router.post("/tasks", async (req: Request, res: Response): Promise<void> => {
  const { columnId, title, description } = req.body;

  if (!columnId || !title) {
    res.status(400).json({ message: "Missing columnId or title" });
    return;
  }

  try {
    await pool.promise().query(
      "INSERT INTO tasks (column_id, title, description) VALUES (?, ?, ?)",
      [columnId, title, description || null]
    );

    res.status(201).json({ message: "Task created" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// 🆕 Create a New Group Board
router.post("/create", async (req: Request, res: Response): Promise<void> => {
  const { name, userId } = req.body;

  if (!name || !userId) {
    res.status(400).json({ message: "Missing name or userId" });
    return;
  }

  try {
    const [createRes]: any = await pool
      .promise()
      .query("INSERT INTO group_boards (name, user_id, created_at) VALUES (?, ?, NOW())", [
        name, userId
      ]);

    const boardId = createRes.insertId;

    await pool
      .promise()
      .query("INSERT INTO group_board_users (board_id, user_id, permission) VALUES (?, ?, ?)", [
        boardId, userId, "editor"
      ]);

    res.status(201).json({ success: true, boardId });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ success: false, message: "Failed to create board" });
  }
});

// 📩 Invite User to Board
router.post("/invite", async (req: Request, res: Response): Promise<void> => {
  const { boardId, email, role } = req.body;

  if (!boardId || !email || !role) {
    res.status(400).json({ message: "Missing boardId, email, or role" });
    return;
  }

  try {
    const [userRows]: any[] = await pool
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (userRows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userId = userRows[0].id;

    await pool
      .promise()
      .query("INSERT INTO group_board_users (board_id, user_id, permission) VALUES (?, ?, ?)", [
        boardId, userId, role
      ]);

    res.status(200).json({ message: "User invited" });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ message: "Failed to invite user" });
  }
});

export default router;
