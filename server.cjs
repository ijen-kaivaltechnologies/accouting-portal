const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const envSetup = require('./set-env.cjs');
const checkRequirements = require('./check-reuirements.cjs');

const args = process.argv.slice(2);
envSetup.init(args[0]);

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL;

checkRequirements.check().then(() => {
  console.log(`✅ All requirements met! Your application is running on port ${port}`);
}).catch((error) => {
  console.error("Error running checks:", error);
  process.exit(1);
});

// Increase body size limit to 25MB
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));


// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory for routes not starting with '/api'
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    app.use(express.static(path.join(__dirname, 'dist')));
    return next();
  }
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { password, email, firstName, lastName, confirmPassword } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await pool.connect();

    const fullName = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    } 
    
    try {
      await client.query('BEGIN');

      // validate user input
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Invalid password' });
      }
      
      await client.query(
        'INSERT INTO users (full_name, password, email) VALUES ($1, $2, $3) RETURNING id',
        [fullName, hashedPassword, email]
      );

      await client.query('COMMIT');
      
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, password FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });

      res.json({ token, fullName: user.full_name });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
    console.log(err);
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT username, email FROM users WHERE id = $1',
        [req.user.id]
      );
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Client routes - all protected by authenticateToken middleware
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM clients ORDER BY created_at DESC');
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, groupName, mobileNumber, city } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !mobileNumber || !city) {
      return res.status(400).json({ error: 'First name, last name, mobile number, and city are required' });
    }

    // Validate mobile number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    const client = await pool.connect();

    // check if phone number is already in use
    const phoneCheck = await client.query(
      'SELECT * FROM clients WHERE mobile_number = $1',
      [mobileNumber]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Mobile number already in use' });
    }

    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'INSERT INTO clients (first_name, last_name, email, group_name, mobile_number, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [firstName, lastName, email || null, groupName || null, mobileNumber, city]
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error creating client:", err);
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, groupName, mobileNumber, city, is_active } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !mobileNumber || !city) {
      return res.status(400).json({ error: 'First name, last name, mobile number, and city are required' });
    }

    // Validate mobile number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const client = await pool.connect();

    // check if phone number is already in use
    const phoneCheck = await client.query(
      'SELECT * FROM clients WHERE mobile_number = $1 AND id != $2',
      [mobileNumber, req.params.id]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Mobile number already in use' });
    }

    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'UPDATE clients SET first_name = $1, last_name = $2, email = $3, group_name = $4, mobile_number = $5, city = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
        [firstName, lastName, email || null, groupName || null, mobileNumber, city, is_active ?? true, req.params.id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Client not found' });
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE id = $1 AND is_active = true',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // delete
      await client.query(
        'DELETE FROM clients WHERE id = $1',
        [req.params.id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Client deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get the base directory for client folders
const CLIENT_FOLDERS_BASE = path.join(__dirname, 'client_folders');

// Helper function to get client folder path
function getClientFolderPath(clientId) {
  return path.join(CLIENT_FOLDERS_BASE, clientId);
}

// Helper function to create client base directory if it doesn't exist
async function ensureClientDirectory(clientId) {
  const clientPath = getClientFolderPath(clientId);
  if (!fs.existsSync(clientPath)) {
    await fs.promises.mkdir(clientPath, { recursive: true });
  }
}

// Helper function to get full folder path
function getFolderFullPath(clientId, folderName) {
  return path.join(getClientFolderPath(clientId), folderName);
}


// Helper function to get file path
function getFilePath(clientId, folderName, fileName) {
  return path.join(getFolderFullPath(clientId, folderName), fileName);
}

// Get all folders for a client
app.get('/api/clients/:clientId/folders', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM client_folders WHERE client_id = $1 ORDER BY created_at DESC',
        [req.params.clientId]
      );
      
      // Check if all folders exist on filesystem
      const folders = result.rows.map(folder => {
        const folderPath = getFolderFullPath(req.params.clientId, folder.folder_name);
        folder.exists = fs.existsSync(folderPath);
        return folder;
      });

      res.json(folders);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new folder
app.post('/api/clients/:clientId/folders', authenticateToken, async (req, res) => {
  try {
    const { folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Ensure client directory exists
    await ensureClientDirectory(req.params.clientId);

    // Create folder on filesystem
    const folderPath = getFolderFullPath(req.params.clientId, folderName);
    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }
    await fs.promises.mkdir(folderPath);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO client_folders (client_id, folder_name) VALUES ($1, $2) RETURNING *',
        [req.params.clientId, folderName]
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      // Clean up the created folder if DB operation fails
      await fs.promises.rmdir(folderPath).catch(() => {});
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a folder (rename)
app.put('/api/clients/:clientId/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const { folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current folder name
      const result = await client.query(
        'SELECT folder_name FROM client_folders WHERE id = $1 AND client_id = $2',
        [req.params.folderId, req.params.clientId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Folder not found' });
      }

      const oldFolderName = result.rows[0].folder_name;
      const oldFolderPath = getFolderFullPath(req.params.clientId, oldFolderName);
      const newFolderPath = getFolderFullPath(req.params.clientId, folderName);

      // Check if new folder name already exists
      if (fs.existsSync(newFolderPath)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Folder name already exists' });
      }

      // Rename folder on filesystem
      await fs.promises.rename(oldFolderPath, newFolderPath);

      // Update database
      const updateResult = await client.query(
        'UPDATE client_folders SET folder_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND client_id = $3 RETURNING *',
        [folderName, req.params.folderId, req.params.clientId]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        // Rollback filesystem change if DB update fails
        await fs.promises.rename(newFolderPath, oldFolderPath).catch(() => {});
        return res.status(404).json({ error: 'Folder not found' });
      }

      await client.query('COMMIT');
      res.json(updateResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a folder
app.delete('/api/clients/:clientId/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get folder name
      const result = await client.query(
        'SELECT folder_name FROM client_folders WHERE id = $1 AND client_id = $2',
        [req.params.folderId, req.params.clientId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Folder not found' });
      }

      const folderName = result.rows[0].folder_name;
      const folderPath = getFolderFullPath(req.params.clientId, folderName);

      // Delete folder from filesystem
      if (fs.existsSync(folderPath)) {
        await fs.promises.rm(folderPath, { recursive: true });
      }

      // Delete from database
      const deleteResult = await client.query(
        'DELETE FROM client_folders WHERE id = $1 AND client_id = $2 RETURNING *',
        [req.params.folderId, req.params.clientId]
      );

      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Folder not found' });
      }

      await client.query('COMMIT');
      res.json({ message: 'Folder deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all files in a folder
app.get('/api/clients/:clientId/folders/:folderId/files', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get folder name
      const result = await client.query(
        'SELECT folder_name FROM client_folders WHERE id = $1 AND client_id = $2',
        [req.params.folderId, req.params.clientId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      // Get files from database
      const files = await client.query(
        'SELECT id, name, size, last_modified FROM client_folder_files WHERE folder_id = $1 ORDER BY name',
        [req.params.folderId]
      );

      // Format the response
      const formattedFiles = files.rows.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        lastModified: file.last_modified,
        isFile: true,
        isDirectory: false
      }));

      res.json(formattedFiles);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file to folder
app.post('/api/clients/:clientId/folders/:folderId/files', authenticateToken, async (req, res) => {
  try {
    const { file, fileName } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and filename are required' });
    }

    // Check file size limit (25MB = 25 * 1024 * 1024 bytes)
    const maxSize = 25 * 1024 * 1024;
    const fileBuffer = Buffer.from(file, 'base64');
    const fileSize = fileBuffer.length;

    if (fileSize > maxSize) {
      return res.status(400).json({ 
        error: 'File size exceeds the maximum limit of 25MB',
        maxSize: maxSize,
        uploadedSize: fileSize
      });
    }

    const client = await pool.connect();
    try {
      // Get folder name
      const result = await client.query(
        'SELECT folder_name FROM client_folders WHERE id = $1 AND client_id = $2',
        [req.params.folderId, req.params.clientId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      const folderName = result.rows[0].folder_name;
      const filePath = getFilePath(req.params.clientId, folderName, fileName);

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'File already exists' });
      }

      // Write file to disk
      await fs.promises.writeFile(filePath, file, 'base64');

      // Get file size
      const stats = await fs.promises.stat(filePath);
      const fileSize = stats.size;

      // Insert into database
      await client.query(
        'INSERT INTO client_folder_files (folder_id, name, relative_path, size, last_modified) VALUES ($1, $2, $3, $4, $5)',
        [req.params.folderId, fileName, filePath, fileSize, new Date()]
      );

      res.json({ message: 'File uploaded successfully' });
    } catch (err) {
      console.error('Error uploading file:', err);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download file
app.get('/api/clients/:clientId/folders/:folderId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get file information from database
      const fileResult = await client.query(
        'SELECT f.relative_path, f.name, f.size FROM client_folder_files f ' +
        'WHERE f.id = $1 AND f.folder_id = $2',
        [req.params.fileId, req.params.folderId]
      );

      if (fileResult.rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const { relative_path: filePath, name, size } = fileResult.rows[0];

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileStream = fs.createReadStream(filePath);

      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      const safeFileName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

      // Pipe file to response
      fileStream.pipe(res);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file
app.delete('/api/clients/:clientId/folders/:folderId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get file information from database
      const fileResult = await client.query(
        'SELECT f.relative_path, f.name FROM client_folder_files f ' +
        'WHERE f.id = $1 AND f.folder_id = $2',
        [req.params.fileId, req.params.folderId]
      );

      if (fileResult.rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const { relative_path: filePath, name } = fileResult.rows[0];

      // Delete file from database
      await client.query(
        'DELETE FROM client_folder_files WHERE id = $1',
        [req.params.fileId]
      );

      // Delete file from filesystem
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      res.json({ message: 'File deleted successfully' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rename file
app.put('/api/clients/:clientId/folders/:folderId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { newFileName } = req.body;

    if (!newFileName) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const client = await pool.connect();
    try {
      // Get file information from database
      const fileResult = await client.query(
        'SELECT f.relative_path, f.name, f.folder_id FROM client_folder_files f ' +
        'WHERE f.id = $1',
        [req.params.fileId]
      );

      if (fileResult.rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const { relative_path: oldFilePath, name: oldFileName, folder_id } = fileResult.rows[0];
      const newFilePath = oldFilePath.replace(oldFileName, newFileName);

      // Check if new file already exists in database
      const existingFile = await client.query(
        'SELECT id FROM client_folder_files WHERE folder_id = $1 AND name = $2',
        [folder_id, newFileName]
      );

      if (existingFile.rows.length > 0) {
        return res.status(400).json({ error: 'File with new name already exists' });
      }

      // Rename file in filesystem
      await fs.promises.rename(oldFilePath, newFilePath);

      // Update file record in database
      await client.query(
        'UPDATE client_folder_files SET name = $1, relative_path = $2, last_modified = CURRENT_TIMESTAMP WHERE id = $3',
        [newFileName, newFilePath, req.params.fileId]
      );

      res.json({ message: 'File renamed successfully' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error renaming file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Generate sharable link for a folder
app.post('/api/clients/:clientId/folders/:folderId/share', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Validate if the folder exists
      const folderCheck = await client.query(
        'SELECT id FROM client_folders WHERE id = $1',
        [req.params.folderId]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      // Generate a unique code for the share link
      const code = crypto.randomBytes(16).toString('hex');

      // Insert the share link into the database
      await client.query(
        'INSERT INTO folder_links (code, folder_id, client_id) VALUES ($1, $2, $3)',
        [code, req.params.folderId, req.params.clientId]
      );

      // Get the base URL of the server
      const shareUrl = `${baseUrl}/shared/folder/${code}`;

      res.json({
        success: true,
        share_url: shareUrl,
        code: code,
        message: 'Share link generated successfully'
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error generating share link:', err);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Fetch files using share code
app.get('/api/shared/folder/:code', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get folder information from the share code
      const folderInfo = await client.query(
        'SELECT fl.folder_id, fl.client_id, fl.expiry FROM folder_links fl WHERE fl.code = $1',
        [req.params.code]
      );

      if (folderInfo.rows.length === 0) {
        return res.status(404).json({ error: 'Share link not found' });
      }

      const { folder_id, expiry } = folderInfo.rows[0];

      // Check if the link has expired
      if (expiry < new Date()) {
        // Delete the expired link
        await client.query(
          'DELETE FROM folder_links WHERE code = $1',
          [req.params.code]
        );
        return res.status(403).json({ error: 'Share link has expired' });
      }

      // Get files from the folder
      const files = await client.query(
        'SELECT f.id, f.name, f.size, f.last_modified FROM client_folder_files f WHERE f.folder_id = $1',
        [folder_id]
      );

      res.json({
        success: true,
        expiry: expiry.toISOString(),
        files: files.rows.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          last_modified: file.last_modified
        }))
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching shared folder files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file from shared folder
app.get('/api/shared/folder/:code/files/:fileId', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get folder and file information from share code
      const folderInfo = await client.query(
        'SELECT fl.folder_id, f.relative_path, f.name ' +
        'FROM folder_links fl ' +
        'JOIN client_folder_files f ON fl.folder_id = f.folder_id ' +
        'WHERE fl.code = $1 AND f.id = $2',
        [req.params.code, req.params.fileId]
      );

      if (folderInfo.rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const { relative_path: filePath, name } = folderInfo.rows[0];

      // Check if the link has expired
      const expiryCheck = await client.query(
        'SELECT expiry FROM folder_links WHERE code = $1',
        [req.params.code]
      );

      if (expiryCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Share link not found' });
      }

      const { expiry } = expiryCheck.rows[0];

      if (expiry < new Date()) {
        // Delete the expired link
        await client.query(
          'DELETE FROM folder_links WHERE code = $1',
          [req.params.code]
        );
        return res.status(403).json({ error: 'Share link has expired' });
      }

      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileStream = fs.createReadStream(filePath);

      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      const safeFileName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

      // Pipe file to response
      fileStream.pipe(res);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error downloading shared file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});