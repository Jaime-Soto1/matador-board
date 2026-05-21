import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from './db';
import multer from 'multer';
import fs from 'fs';
import boardRoutes from './boardRoutes';
import { ResultSetHeader } from "mysql2";



const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/api/boards', boardRoutes);
app.use(express.static('uploads')); // Serve uploaded files
const upload = multer({ dest: 'uploads/' });

app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
    const { tokenId } = req.body;
    console.log('Received login request with tokenId:', tokenId);
  
    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      const email = response.data.email;
      const name = response.data.name;
  
      // Check if user already exists
      const [existingUser]: [any[], any] = await pool.promise().query(
        'SELECT * FROM users WHERE email = ?', [email]
      );
  
      let user;
  
      if (existingUser.length > 0) {
        user = existingUser[0];
        console.log('Existing user found:', user);
      } else {
        // Determine role based on email domain
        const role = email.endsWith('@csun.edu') ? 'faculty' : 'user';
  
        const [insertResult]: any = await pool.promise().query(
          'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
          [email, name, role]
        );
  
        user = {
          id: insertResult.insertId,
          email,
          name,
          role
        };
  
        console.log('New user created:', user);
      }
  
      // Auto-join group boards based on pending invites
      const [invites]: [any[], any] = await pool.promise().query(
        'SELECT * FROM invites WHERE invited_email = ?',
        [email]
      );
  
      for (const invite of invites) {
        const [alreadyJoined]: [any[], any] = await pool.promise().query(
          'SELECT * FROM group_board_users WHERE board_id = ? AND user_id = ?',
          [invite.board_id, user.id]
        );
  
        if (alreadyJoined.length === 0) {
          await pool.promise().query(
            'INSERT INTO group_board_users (board_id, user_id, permission) VALUES (?, ?, ?)',
            [invite.board_id, user.id, invite.role]
          );
  
          console.log(`Auto-added ${email} to board ${invite.board_id} as ${invite.role}`);
        }
      }
  
      res.json({ user });
  
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  

  app.post('/api/documents', upload.single('file'), async (req, res) => {
    console.log(req.body);
    const { userId, recipientEmail } = req.body;
    const filePath = req.file?.path;
  
    if (!filePath) {
        console.error('Error: No file uploaded');
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
  
    try {
        await pool.promise().query(
            'INSERT INTO documents (user_id, recipient_email, file_path, status) VALUES (?, ?, ?, "Pending")',
            [userId, recipientEmail, filePath]
        );
        console.log('Document uploaded successfully');
        res.json({
            message: 'Document uploaded and sent successfully',
            userId,
            recipientEmail,
            filePath   // <-- Add this line for frontend
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Error uploading document' });
    }
  });
  
app.post('/api/users/by-email', async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
  
    if (!email) {
      res.status(400).json({ message: "Missing email" });
      return;
    }
  
    try {
      const [user]: [any[], any] = await pool.promise().query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
  
      if (user.length > 0) {
        res.json({ user: user[0] });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (err) {
      console.error("Error finding user by email:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  

// 📄 Get User's Role
app.get('/api/get-user-role', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId; // Assuming userId is passed as query parameter
        const [user]: [any[], any] = await pool.promise().query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (user.length > 0) {
            res.json({ role: user[0].role }); // Send role to frontend
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 📄 Get Documents (For a User)
app.get('/api/documents', async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;

    try {
        const [results]: any[] = await pool.promise().query(
            'SELECT * FROM documents WHERE user_id = ? OR recipient_email = ?',
            [userId, userId]
        );
        res.json(results);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

// Approve a Document
app.patch('/api/documents/:id/approve', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const [userResult]: any[] = await pool.promise().query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0 || userResult[0].role !== 'faculty') {
            return void res.status(403).json({ message: 'Only faculty members can approve documents.' });
        }

        await pool.promise().query(
            'UPDATE documents SET status = "Approved" WHERE id = ?',
            [id]
        );
        console.log(`Document with ID ${id} approved`);
        res.status(200).json({ message: 'Document approved' });
    } catch (error) {
        console.error('Error approving document:', error);
        res.status(500).json({ message: 'Error approving document' });
    }
});

// Reject a Document
app.patch('/api/documents/:id/reject', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const [userResult]: any[] = await pool.promise().query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0 || userResult[0].role !== 'faculty') {
            return void res.status(403).json({ message: 'Only faculty members can reject documents.' });
        }

        await pool.promise().query(
            'UPDATE documents SET status = "Rejected" WHERE id = ?',
            [id]
        );
        console.log(`Document with ID ${id} rejected`);
        res.status(200).json({ message: 'Document rejected' });
    } catch (error) {
        console.error('Error rejecting document:', error);
        res.status(500).json({ message: 'Error rejecting document' });
    }
});

// 🗑️ Delete a Document
app.delete('/api/documents/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const [results]: any[] = await pool.promise().query(
            'SELECT file_path FROM documents WHERE id = ?',
            [id]
        );

        if (results.length > 0) {
            const filePath = results[0].file_path;
            try {
                fs.unlinkSync(filePath); // Delete file from the filesystem
                console.log(`File deleted: ${filePath}`);
            } catch (err) {
                console.error(`Error deleting file: ${err}`);
            }
        }

        await pool.promise().query(
            'DELETE FROM documents WHERE id = ?',
            [id]
        );
        console.log(`Document with ID ${id} deleted`);
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Error deleting document' });
    }
});

// 📧 Send a Document to Recipient (Professor/Admin)
app.post('/api/send-document', async (req: Request, res: Response): Promise<void> => {
    const { recipientEmail, filePath } = req.body;

    if (!recipientEmail || !filePath) {
        res.status(400).json({ message: 'Missing recipient email or file path' });
        return;
    }

    try {
        console.log(`Sending document to ${recipientEmail}: ${filePath}`);

        res.status(200).json({ message: `Document sent to ${recipientEmail} with file: ${filePath}` });
    } catch (error) {
        console.error('Error sending document:', error);
        res.status(500).json({ message: 'Error sending document' });
    }
});

app.post("/api/columns", async (req: Request, res: Response) => {
  const { name, board_id } = req.body; // match to your real column names

  try {
    const [result]: any = await pool
      .promise()
      .query("INSERT INTO columns (name, board_id) VALUES (?, ?)", [name, board_id]);

    res.status(200).json({
      column: {
        id: result.insertId,
        title: name,
        board_id,
        tasks: [],
        color: "#1E293B"
      }
    });
  } catch (error) {
    console.error("Error inserting column:", error);
    res.status(500).json({ error: "Failed to create column" });
  }
});



// Create a new task
app.post("/api/tasks", async (req: Request, res: Response) => {
  const { column_id, content } = req.body;

  try {
    const [result]: [ResultSetHeader, any] = await pool
      .promise()
      .query(
        "INSERT INTO tasks (column_id, content) VALUES (?, ?)",
        [column_id, content]
      );

    res.status(200).json({ taskId: result.insertId });
  } catch (error) {
    console.error("Error inserting task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Load all columns and tasks
app.get("/api/board", async (_req: Request, res: Response) => {
  try {
    const [columns] = await pool.promise().query("SELECT * FROM columns");
    const [tasks] = await pool.promise().query("SELECT * FROM tasks");
    res.json({ columns, tasks });
  } catch (error) {
    console.error("Error loading board data:", error);
    res.status(500).json({ error: "Failed to load board" });
  }
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

