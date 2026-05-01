'use strict';

/**
 * Referrer Feature Router
 *
 * Mount in server.cjs:
 *   const referrerRouter = require('./referrer.routes.cjs');
 *   app.use('/api', referrerRouter(pool));
 *
 * All routes are prefixed with /api already via the mount point above.
 */

const express    = require('express');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const path       = require('path');
const fs         = require('fs');
const rateLimit  = require('express-rate-limit');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REFERRER_DOCS_BASE  = path.join(__dirname, 'referrer_docs');
const REFERRAL_DOCS_BASE  = path.join(__dirname, 'referral_docs');
const MAX_FILE_BYTES      = 25 * 1024 * 1024; // 25 MB

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const MOBILE_RE  = /^\d{10}$/;
const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_RE     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAR_RE  = /^\d{12}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function trim(v) {
  if (typeof v !== 'string') return v;
  // Trim and basic HTML tag sanitization to prevent XSS
  return v.trim().replace(/<[^>]*>?/gm, '');
}

// Detect mime type from base64 header or first bytes
function detectMime(base64String) {
  const header = base64String.substring(0, 8);
  if (header.startsWith('JVBER'))    return 'pdf';
  if (header.startsWith('UEsDB'))    return 'xlsx'; // ZIP-based (xlsx)
  if (header.startsWith('0M8R4KG')) return 'xls';
  // Also accept data-uri prefix
  if (base64String.startsWith('data:application/pdf'))                    return 'pdf';
  if (base64String.startsWith('data:application/vnd.openxmlformats'))    return 'xlsx';
  if (base64String.startsWith('data:application/vnd.ms-excel'))          return 'xls';
  return 'unknown';
}

// Strip data-uri prefix if present, return raw base64
function stripDataUri(b64) {
  const comma = b64.indexOf(',');
  return comma !== -1 ? b64.substring(comma + 1) : b64;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

// Save a base64 file to disk; returns the absolute path written
async function saveBase64File(base64Raw, destPath) {
  const raw = stripDataUri(base64Raw);
  const buf = Buffer.from(raw, 'base64');
  if (buf.length > MAX_FILE_BYTES) {
    throw Object.assign(new Error('File exceeds 25 MB limit'), { code: 'FILE_TOO_LARGE' });
  }
  await fs.promises.writeFile(destPath, buf);
  return destPath;
}

// ---------------------------------------------------------------------------
// Factory export — receives the shared pg Pool
// ---------------------------------------------------------------------------
module.exports = function createReferrerRouter(pool) {
  const router = express.Router();

  // =========================================================================
  // MIDDLEWARE
  // =========================================================================

  // Authenticate a referrer JWT (role === 'referrer')
  function authenticateReferrer(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      if (payload.role !== 'referrer') return res.status(403).json({ error: 'Access denied' });
      req.user = payload; // { id, role: 'referrer' }
      next();
    });
  }

  // Authenticate an admin/staff JWT (role === 'admin' | 'staff')
  // Reuses the same users table + JWT_SECRET as the existing login
  function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      // Existing admin tokens may not have role set yet; treat missing role as admin
      if (payload.role && payload.role !== 'admin' && payload.role !== 'staff') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      req.user = payload;
      next();
    });
  }

  // Accepts either a referrer token OR an admin token.
  // Used for read-only endpoints that both roles legitimately need (e.g. /services/plans).
  function authenticateAny(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      req.user = payload;
      next();
    });
  }

  // =========================================================================
  // MODULE 1 — REFERRER AUTH
  // =========================================================================

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
  });

  /**
   * POST /api/referrer/register
   * Public. Register a new referrer; status starts as 'pending'.
   * Body (JSON):
   *   full_name, dob, address, mobile, email, pan_no, aadhar_no,
   *   password, confirm_password,
   *   aadhar_file  (base64 PDF),
   *   pan_file     (base64 PDF),
   *   bank_cancel_check (base64 PDF)
   */
  router.post('/referrer/register', authLimiter, async (req, res) => {
    const client = await pool.connect();
    try {
      let {
        full_name, dob, address, mobile, email,
        pan_no, aadhar_no, password, confirm_password,
        aadhar_file, pan_file, bank_cancel_check,
      } = req.body;

      // Trim all string fields
      full_name  = trim(full_name);
      address    = trim(address);
      mobile     = trim(mobile);
      email      = trim(email)?.toLowerCase();
      pan_no     = trim(pan_no)?.toUpperCase();
      aadhar_no  = trim(aadhar_no);
      dob        = trim(dob);

      // ── Required field presence ──────────────────────────────────────────
      const missing = [];
      if (!full_name)         missing.push('full_name');
      if (!dob)               missing.push('dob');
      if (!address)           missing.push('address');
      if (!mobile)            missing.push('mobile');
      if (!email)             missing.push('email');
      if (!pan_no)            missing.push('pan_no');
      if (!aadhar_no)         missing.push('aadhar_no');
      if (!password)          missing.push('password');
      if (!confirm_password)  missing.push('confirm_password');
      if (!aadhar_file)       missing.push('aadhar_file');
      if (!pan_file)          missing.push('pan_file');
      if (!bank_cancel_check) missing.push('bank_cancel_check');
      if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields', fields: missing });
      }

      // ── Format validations ───────────────────────────────────────────────
      const errors = {};
      if (!MOBILE_RE.test(mobile))    errors.mobile    = 'Mobile number must be exactly 10 digits';
      if (!EMAIL_RE.test(email))      errors.email     = 'Invalid email address';
      if (!PAN_RE.test(pan_no))       errors.pan_no    = 'PAN must be in format ABCDE1234F';
      if (!AADHAR_RE.test(aadhar_no)) errors.aadhar_no = 'Aadhar number must be exactly 12 digits';
      if (!PASSWORD_RE.test(password)) {
        errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number and special character';
      }
      if (password !== confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }

      // Validate DOB is a real date and not in the future
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        errors.dob = 'Date of birth must be a valid past date';
      }

      // Validate file types (must be PDF)
      for (const [field, b64] of [['aadhar_file', aadhar_file], ['pan_file', pan_file], ['bank_cancel_check', bank_cancel_check]]) {
        const mime = detectMime(stripDataUri(b64));
        if (mime !== 'pdf') errors[field] = `${field} must be a PDF file`;
      }

      if (Object.keys(errors).length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }

      // ── Uniqueness checks ────────────────────────────────────────────────
      const uniqueChecks = [
        { field: 'email',     col: 'email',     val: email },
        { field: 'mobile',    col: 'mobile',    val: mobile },
        { field: 'pan_no',    col: 'pan_no',    val: pan_no },
        { field: 'aadhar_no', col: 'aadhar_no', val: aadhar_no },
      ];
      for (const { field, col, val } of uniqueChecks) {
        const check = await client.query(
          `SELECT id FROM referrers WHERE ${col} = $1 LIMIT 1`, [val]
        );
        if (check.rows.length) {
          return res.status(409).json({ error: 'Duplicate value', field, message: `${field} already registered` });
        }
      }

      // ── Insert referrer (get ID first so we can build file paths) ─────────
      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query('BEGIN');

      const insertResult = await client.query(
        `INSERT INTO referrers
           (full_name, password, dob, address, mobile, email, pan_no, aadhar_no,
            aadhar_file_path, pan_file_path, bank_cancel_check_path)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          full_name, hashedPassword, dob, address, mobile, email,
          pan_no, aadhar_no,
          'PENDING', 'PENDING', 'PENDING', // placeholder; updated after file save
        ]
      );
      const referrerId = insertResult.rows[0].id;

      // ── Save files ───────────────────────────────────────────────────────
      const referrerDir = path.join(REFERRER_DOCS_BASE, String(referrerId));
      await ensureDir(referrerDir);

      const aadharPath  = path.join(referrerDir, 'aadhar.pdf');
      const panPath     = path.join(referrerDir, 'pan.pdf');
      const bankPath    = path.join(referrerDir, 'bank_cancel_check.pdf');

      try {
        await saveBase64File(aadhar_file, aadharPath);
        await saveBase64File(pan_file, panPath);
        await saveBase64File(bank_cancel_check, bankPath);
      } catch (fileErr) {
        await client.query('ROLLBACK');
        if (fileErr.code === 'FILE_TOO_LARGE') {
          return res.status(400).json({ error: fileErr.message });
        }
        throw fileErr;
      }

      // ── Update file paths in DB ──────────────────────────────────────────
      await client.query(
        `UPDATE referrers
         SET aadhar_file_path = $1, pan_file_path = $2, bank_cancel_check_path = $3
         WHERE id = $4`,
        [aadharPath, panPath, bankPath, referrerId]
      );

      await client.query('COMMIT');

      return res.status(201).json({ message: 'Registration submitted successfully. Await admin approval.' });

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[referrer/register]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * POST /api/referrer/login
   * Public. Returns JWT with role: 'referrer'.
   */
  router.post('/referrer/login', authLimiter, async (req, res) => {
    const client = await pool.connect();
    try {
      let { email, password } = req.body;
      email = trim(email)?.toLowerCase();

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await client.query(
        `SELECT id, full_name, password, status FROM referrers WHERE email = $1`,
        [email]
      );

      if (!result.rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const referrer = result.rows[0];
      const valid = await bcrypt.compare(password, referrer.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (referrer.status === 'pending') {
        return res.status(403).json({ error: 'Your account is pending admin approval' });
      }
      if (referrer.status === 'rejected') {
        return res.status(403).json({ error: 'Your account registration was rejected' });
      }

      const token = jwt.sign(
        { id: referrer.id, role: 'referrer' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({ token, full_name: referrer.full_name });

    } catch (err) {
      console.error('[referrer/login]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  // =========================================================================
  // MODULE 2 — SERVICE LISTING (referrer-facing, read-only)
  // =========================================================================

  /**
   * GET /api/services/categories
   * Returns all service categories.
   */
  router.get('/services/categories', authenticateAny, async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, slug FROM service_categories ORDER BY id`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error('[services/categories]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/services/plans?category_id=
   * Returns active service plans, optionally filtered by category.
   */
  router.get('/services/plans', authenticateAny, async (req, res) => {
    const client = await pool.connect();
    try {
      const { category_id } = req.query;
      const params = [];
      let where = 'WHERE sp.is_active = true';

      if (category_id) {
        params.push(Number(category_id));
        where += ` AND sp.category_id = $${params.length}`;
      }

      const result = await client.query(
        `SELECT
           sp.id,
           sp.name,
           sp.original_price,
           sp.discount_percent,
           sp.discounted_price,
           sp.commission_amount,
           sc.id   AS category_id,
           sc.name AS category_name,
           sc.slug AS category_slug
         FROM service_plans sp
         JOIN service_categories sc ON sc.id = sp.category_id
         ${where}
         ORDER BY sc.id, sp.id`,
        params
      );
      return res.json(result.rows);
    } catch (err) {
      console.error('[services/plans]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/services/plans/:planId/requirements
   * Returns the ordered document requirements for a plan.
   * Frontend uses this to dynamically render the upload form.
   */
  router.get('/services/plans/:planId/requirements', authenticateAny, async (req, res) => {
    const client = await pool.connect();
    try {
      const planId = Number(req.params.planId);

      // Verify plan exists
      const planCheck = await client.query(
        `SELECT id, name FROM service_plans WHERE id = $1 AND is_active = true`,
        [planId]
      );
      if (!planCheck.rows.length) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const result = await client.query(
        `SELECT id, label, field_type, month_index, is_optional, sort_order
         FROM plan_document_requirements
         WHERE plan_id = $1
         ORDER BY sort_order, id`,
        [planId]
      );

      return res.json({
        plan_id: planId,
        plan_name: planCheck.rows[0].name,
        requirements: result.rows,
      });
    } catch (err) {
      console.error('[services/plans/:planId/requirements]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  // =========================================================================
  // MODULE 3 — REFERRAL REQUESTS (referrer-facing)
  // =========================================================================

  /**
   * POST /api/referrer/requests
   * Submit a new referral request with documents.
   *
   * Body:
   * {
   *   plan_id: number,
   *   customer_name: string,
   *   customer_mobile: string (optional),
   *   documents: [
   *     { requirement_id: number, file: base64string, file_name: string }   // for pdf/excel
   *     { requirement_id: number, text_value: string }                       // for text fields (MSME)
   *   ]
   * }
   */
  router.post('/referrer/requests', authenticateReferrer, async (req, res) => {
    const client = await pool.connect();
    try {
      let { plan_id, customer_name, customer_mobile, documents } = req.body;

      customer_name   = trim(customer_name);
      customer_mobile = trim(customer_mobile);

      // ── Basic presence ───────────────────────────────────────────────────
      if (!plan_id || !customer_name) {
        return res.status(400).json({ error: 'plan_id and customer_name are required' });
      }
      if (!Array.isArray(documents) || !documents.length) {
        return res.status(400).json({ error: 'documents array is required' });
      }

      // ── Validate customer_mobile if provided ─────────────────────────────
      if (customer_mobile && !MOBILE_RE.test(customer_mobile)) {
        return res.status(400).json({ error: 'customer_mobile must be exactly 10 digits' });
      }

      // ── Verify plan exists ───────────────────────────────────────────────
      const planResult = await client.query(
        `SELECT sp.id, sp.name, sp.original_price, sp.discounted_price, sp.commission_amount
         FROM service_plans sp
         WHERE sp.id = $1 AND sp.is_active = true`,
        [Number(plan_id)]
      );
      if (!planResult.rows.length) {
        return res.status(404).json({ error: 'Plan not found or inactive' });
      }

      // ── Fetch all requirements for the plan ──────────────────────────────
      const reqsResult = await client.query(
        `SELECT id, label, field_type, is_optional
         FROM plan_document_requirements
         WHERE plan_id = $1`,
        [Number(plan_id)]
      );
      const requirements = reqsResult.rows;

      // Index incoming documents by requirement_id for quick lookup
      const docMap = {};
      for (const doc of documents) {
        docMap[doc.requirement_id] = doc;
      }

      // ── Validate all non-optional requirements are covered ───────────────
      const validationErrors = [];
      for (const req of requirements) {
        if (req.is_optional) continue;
        const supplied = docMap[req.id];
        if (!supplied) {
          validationErrors.push(`Missing required document: "${req.label}"`);
          continue;
        }
        if (req.field_type === 'text' && !trim(supplied.text_value)) {
          validationErrors.push(`"${req.label}" requires a text value`);
        }
        if ((req.field_type === 'pdf' || req.field_type === 'excel') && !supplied.file) {
          validationErrors.push(`"${req.label}" requires a file upload`);
        }
      }

      // ── Validate file types for each supplied document ───────────────────
      for (const doc of documents) {
        if (!doc.file) continue;
        const reqDef = requirements.find(r => r.id === doc.requirement_id);
        if (!reqDef) {
          validationErrors.push(`Unknown requirement_id: ${doc.requirement_id}`);
          continue;
        }
        const mime = detectMime(stripDataUri(doc.file));
        if (reqDef.field_type === 'pdf' && mime !== 'pdf') {
          validationErrors.push(`"${reqDef.label}" must be a PDF file`);
        }
        if (reqDef.field_type === 'excel' && mime !== 'xlsx' && mime !== 'xls') {
          validationErrors.push(`"${reqDef.label}" must be an Excel file (.xlsx or .xls)`);
        }
      }

      if (validationErrors.length) {
        return res.status(400).json({ error: 'Document validation failed', details: validationErrors });
      }

      // ── DB transaction ───────────────────────────────────────────────────
      await client.query('BEGIN');

      // Insert referral request
      const requestResult = await client.query(
        `INSERT INTO referral_requests
           (referrer_id, plan_id, customer_name, customer_mobile, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [req.user.id, Number(plan_id), customer_name, customer_mobile || null]
      );
      const requestId = requestResult.rows[0].id;

      // Save files to disk
      const requestDir = path.join(REFERRAL_DOCS_BASE, String(requestId));
      await ensureDir(requestDir);

      // Insert document rows
      for (const doc of documents) {
        const reqDef = requirements.find(r => r.id === doc.requirement_id);
        if (!reqDef) continue;

        let filePath  = null;
        let textValue = null;

        if (reqDef.field_type === 'text') {
          textValue = trim(doc.text_value);
        } else {
          // Save file
          const ext = reqDef.field_type === 'excel' ? 'xlsx' : 'pdf';
          const fileName = `${reqDef.id}_${slugify(reqDef.label)}.${ext}`;
          const destPath = path.join(requestDir, fileName);
          try {
            await saveBase64File(doc.file, destPath);
          } catch (fileErr) {
            await client.query('ROLLBACK');
            if (fileErr.code === 'FILE_TOO_LARGE') {
              return res.status(400).json({ error: `File too large for "${reqDef.label}". Max 25 MB.` });
            }
            throw fileErr;
          }
          filePath = destPath;
        }

        await client.query(
          `INSERT INTO referral_request_documents
             (request_id, requirement_id, file_path, text_value, month_index)
           VALUES ($1, $2, $3, $4, $5)`,
          [requestId, reqDef.id, filePath, textValue, reqDef.month_index ?? null]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Request submitted successfully. Pending admin review.',
        request_id: requestId,
        status: 'pending',
      });

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[referrer/requests POST]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/referrer/requests
   * List all referral requests by the logged-in referrer.
   * Query params: ?status=pending|approved|rejected
   */
  router.get('/referrer/requests', authenticateReferrer, async (req, res) => {
    const client = await pool.connect();
    try {
      const { status } = req.query;
      const params = [req.user.id];
      let statusFilter = '';

      const allowed = ['pending', 'approved', 'rejected'];
      if (status && allowed.includes(status)) {
        params.push(status);
        statusFilter = `AND rr.status = $${params.length}`;
      }

      const result = await client.query(
        `SELECT
           rr.id            AS request_id,
           sp.name          AS plan_name,
           sc.name          AS category_name,
           rr.customer_name,
           rr.customer_mobile,
           rr.status,
           rr.admin_note,
           rr.created_at,
           rr.reviewed_at
         FROM referral_requests rr
         JOIN service_plans sp     ON sp.id = rr.plan_id
         JOIN service_categories sc ON sc.id = sp.category_id
         WHERE rr.referrer_id = $1
         ${statusFilter}
         ORDER BY rr.created_at DESC`,
        params
      );

      return res.json(result.rows);
    } catch (err) {
      console.error('[referrer/requests GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/referrer/requests/:requestId
   * Full detail of a single request, including all uploaded documents.
   */
  router.get('/referrer/requests/:requestId', authenticateReferrer, async (req, res) => {
    const client = await pool.connect();
    try {
      const requestId = Number(req.params.requestId);

      const reqResult = await client.query(
        `SELECT
           rr.id, rr.plan_id, rr.customer_name, rr.customer_mobile,
           rr.status, rr.admin_note, rr.created_at, rr.reviewed_at,
           sp.name          AS plan_name,
           sp.original_price, sp.discounted_price, sp.commission_amount,
           sc.name          AS category_name
         FROM referral_requests rr
         JOIN service_plans sp      ON sp.id = rr.plan_id
         JOIN service_categories sc ON sc.id = sp.category_id
         WHERE rr.id = $1 AND rr.referrer_id = $2`,
        [requestId, req.user.id]
      );

      if (!reqResult.rows.length) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const docsResult = await client.query(
        `SELECT
           rrd.id,
           pdr.label,
           pdr.field_type,
           rrd.text_value,
           rrd.month_index,
           CASE WHEN rrd.file_path IS NOT NULL THEN true ELSE false END AS has_file
         FROM referral_request_documents rrd
         JOIN plan_document_requirements pdr ON pdr.id = rrd.requirement_id
         WHERE rrd.request_id = $1
         ORDER BY pdr.sort_order`,
        [requestId]
      );

      return res.json({
        ...reqResult.rows[0],
        documents: docsResult.rows,
      });
    } catch (err) {
      console.error('[referrer/requests/:id GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  // =========================================================================
  // MODULE 4 — EARNINGS (referrer-facing)
  // =========================================================================

  /**
   * GET /api/referrer/earnings
   * Returns total commission earned and per-request breakdown.
   */
  router.get('/referrer/earnings', authenticateReferrer, async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
           fe.id            AS finance_id,
           fe.request_id,
           fe.plan_name,
           fe.original_price,
           fe.discounted_price,
           fe.commission_earned,
           fe.created_at,
           rr.customer_name
         FROM finance_entries fe
         JOIN referral_requests rr ON rr.id = fe.request_id
         WHERE fe.referrer_id = $1
         ORDER BY fe.created_at DESC`,
        [req.user.id]
      );

      const total = result.rows.reduce(
        (sum, row) => sum + parseFloat(row.commission_earned),
        0
      );

      return res.json({
        total_earned: parseFloat(total.toFixed(2)),
        entries: result.rows,
      });
    } catch (err) {
      console.error('[referrer/earnings]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  // =========================================================================
  // MODULE 5 — ADMIN: REFERRER MANAGEMENT
  // =========================================================================

  /**
   * GET /api/admin/referrers
   * List all referrers. Query: ?status=pending|approved|rejected&page=1&limit=20
   */
  router.get('/admin/referrers', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const params = [];
      let where = '';

      const allowed = ['pending', 'approved', 'rejected'];
      if (status && allowed.includes(status)) {
        params.push(status);
        where = `WHERE status = $${params.length}`;
      }

      params.push(Number(limit), offset);

      const result = await client.query(
        `SELECT
           id, full_name, email, mobile, pan_no, aadhar_no,
           dob, address, status, created_at, reviewed_at
         FROM referrers
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM referrers ${where}`,
        params.slice(0, params.length - 2) // exclude limit/offset
      );

      return res.json({
        total: Number(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        referrers: result.rows,
      });
    } catch (err) {
      console.error('[admin/referrers GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/admin/referrers/:id
   * Full referrer profile for admin review.
   */
  router.get('/admin/referrers/:id', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
           id, full_name, email, mobile, pan_no, aadhar_no,
           dob, address, status, reviewed_at, created_at,
           aadhar_file_path, pan_file_path, bank_cancel_check_path
         FROM referrers
         WHERE id = $1`,
        [Number(req.params.id)]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Referrer not found' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('[admin/referrers/:id GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * PUT /api/admin/referrers/:id/status
   * Approve or reject a referrer registration.
   * Body: { status: 'approved' | 'rejected', note?: string }
   */
  router.put('/admin/referrers/:id/status', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const { status, note } = req.body;
      const allowed = ['approved', 'rejected'];
      if (!status || !allowed.includes(status)) {
        return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
      }

      const result = await client.query(
        `UPDATE referrers
         SET status = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3
         RETURNING id, full_name, email, status, reviewed_at`,
        [status, req.user.id, Number(req.params.id)]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Referrer not found' });
      }

      return res.json({
        message: `Referrer ${status} successfully`,
        referrer: result.rows[0],
      });
    } catch (err) {
      console.error('[admin/referrers/:id/status]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/admin/referrers/:id/documents/:docType
   * Stream a referrer's KYC document to the admin.
   * docType: 'aadhar' | 'pan' | 'bank_cancel_check'
   */
  router.get('/admin/referrers/:id/documents/:docType', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const colMap = {
        aadhar:            'aadhar_file_path',
        pan:               'pan_file_path',
        bank_cancel_check: 'bank_cancel_check_path',
      };
      const col = colMap[req.params.docType];
      if (!col) {
        return res.status(400).json({ error: 'docType must be aadhar, pan, or bank_cancel_check' });
      }

      const result = await client.query(
        `SELECT ${col} AS file_path FROM referrers WHERE id = $1`,
        [Number(req.params.id)]
      );
      if (!result.rows.length || !result.rows[0].file_path) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const filePath = result.rows[0].file_path;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      const stats = fs.statSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${req.params.docType}.pdf"`);
      fs.createReadStream(filePath).pipe(res);

    } catch (err) {
      console.error('[admin/referrers/:id/documents/:docType]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  // =========================================================================
  // MODULE 6 — ADMIN: REQUEST MANAGEMENT
  // =========================================================================

  /**
   * GET /api/admin/requests
   * List all referral requests.
   * Query: ?status=pending|approved|rejected&referrer_id=&plan_id=&page=1&limit=20
   */
  router.get('/admin/requests', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const { status, referrer_id, plan_id, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const params = [];
      const conditions = [];

      const allowedStatus = ['pending', 'approved', 'rejected'];
      if (status && allowedStatus.includes(status)) {
        params.push(status);
        conditions.push(`rr.status = $${params.length}`);
      }
      if (referrer_id) {
        params.push(Number(referrer_id));
        conditions.push(`rr.referrer_id = $${params.length}`);
      }
      if (plan_id) {
        params.push(Number(plan_id));
        conditions.push(`rr.plan_id = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(Number(limit), offset);

      const result = await client.query(
        `SELECT
           rr.id            AS request_id,
           rr.customer_name,
           rr.customer_mobile,
           rr.status,
           rr.admin_note,
           rr.created_at,
           rr.reviewed_at,
           sp.name          AS plan_name,
           sp.original_price,
           sp.commission_amount,
           sc.name          AS category_name,
           ref.full_name    AS referrer_name,
           ref.mobile       AS referrer_mobile,
           ref.email        AS referrer_email
         FROM referral_requests rr
         JOIN service_plans sp      ON sp.id = rr.plan_id
         JOIN service_categories sc ON sc.id = sp.category_id
         JOIN referrers ref         ON ref.id = rr.referrer_id
         ${where}
         ORDER BY rr.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM referral_requests rr ${where}`,
        params.slice(0, params.length - 2)
      );

      return res.json({
        total: Number(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        requests: result.rows,
      });
    } catch (err) {
      console.error('[admin/requests GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/admin/requests/:requestId
   * Full request detail including all documents.
   */
  router.get('/admin/requests/:requestId', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const requestId = Number(req.params.requestId);

      const reqResult = await client.query(
        `SELECT
           rr.id, rr.customer_name, rr.customer_mobile,
           rr.status, rr.admin_note, rr.created_at, rr.reviewed_at,
           sp.id            AS plan_id,
           sp.name          AS plan_name,
           sp.original_price, sp.discounted_price, sp.commission_amount,
           sc.name          AS category_name,
           ref.id           AS referrer_id,
           ref.full_name    AS referrer_name,
           ref.email        AS referrer_email,
           ref.mobile       AS referrer_mobile,
           ref.pan_no       AS referrer_pan
         FROM referral_requests rr
         JOIN service_plans sp      ON sp.id = rr.plan_id
         JOIN service_categories sc ON sc.id = sp.category_id
         JOIN referrers ref         ON ref.id = rr.referrer_id
         WHERE rr.id = $1`,
        [requestId]
      );

      if (!reqResult.rows.length) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const docsResult = await client.query(
        `SELECT
           rrd.id,
           pdr.label,
           pdr.field_type,
           rrd.file_path,
           rrd.text_value,
           rrd.month_index
         FROM referral_request_documents rrd
         JOIN plan_document_requirements pdr ON pdr.id = rrd.requirement_id
         WHERE rrd.request_id = $1
         ORDER BY pdr.sort_order`,
        [requestId]
      );

      return res.json({
        ...reqResult.rows[0],
        documents: docsResult.rows,
      });
    } catch (err) {
      console.error('[admin/requests/:id GET]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * GET /api/admin/requests/:requestId/documents/:documentId
   * Stream a specific uploaded document to the admin for review.
   */
  router.get('/admin/requests/:requestId/documents/:documentId', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT rrd.file_path, pdr.label, pdr.field_type
         FROM referral_request_documents rrd
         JOIN plan_document_requirements pdr ON pdr.id = rrd.requirement_id
         WHERE rrd.id = $1 AND rrd.request_id = $2`,
        [Number(req.params.documentId), Number(req.params.requestId)]
      );

      if (!result.rows.length || !result.rows[0].file_path) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const { file_path, label, field_type } = result.rows[0];

      if (!fs.existsSync(file_path)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      const ext = field_type === 'excel' ? 'xlsx' : 'pdf';
      const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
      const contentType = field_type === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      const stats = fs.statSync(file_path);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${safeLabel}.${ext}"`);
      fs.createReadStream(file_path).pipe(res);

    } catch (err) {
      console.error('[admin/requests/:id/documents/:docId]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  /**
   * PUT /api/admin/requests/:requestId/decision
   * Approve or reject a referral request.
   * On approval: atomically creates a finance_entries row.
   *
   * Body: { decision: 'approved' | 'rejected', admin_note?: string }
   */
  router.put('/admin/requests/:requestId/decision', authenticateAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const requestId = Number(req.params.requestId);
      const { decision, admin_note } = req.body;

      const allowed = ['approved', 'rejected'];
      if (!decision || !allowed.includes(decision)) {
        return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
      }

      // Fetch the request and lock it
      const reqResult = await client.query(
        `SELECT rr.id, rr.status, rr.referrer_id, rr.plan_id,
                sp.name AS plan_name, sp.original_price, sp.discounted_price, sp.commission_amount
         FROM referral_requests rr
         JOIN service_plans sp ON sp.id = rr.plan_id
         WHERE rr.id = $1
         FOR UPDATE`,
        [requestId]
      );

      if (!reqResult.rows.length) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const request = reqResult.rows[0];

      if (request.status !== 'pending') {
        return res.status(409).json({ error: `Request already ${request.status}` });
      }

      await client.query('BEGIN');

      // Update request status
      await client.query(
        `UPDATE referral_requests
         SET status = $1, admin_note = $2, reviewed_by = $3, reviewed_at = NOW()
         WHERE id = $4`,
        [decision, trim(admin_note) || null, req.user.id, requestId]
      );

      let financeEntry = null;

      // If approved → create finance entry (price snapshot)
      if (decision === 'approved') {
        const feResult = await client.query(
          `INSERT INTO finance_entries
             (request_id, referrer_id, plan_id, plan_name,
              original_price, discounted_price, commission_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, commission_earned`,
          [
            requestId,
            request.referrer_id,
            request.plan_id,
            request.plan_name,
            request.original_price,
            request.discounted_price,
            request.commission_amount,   // = original_price - discounted_price (seeded)
          ]
        );
        financeEntry = feResult.rows[0];
      }

      await client.query('COMMIT');

      return res.json({
        message: `Request ${decision} successfully`,
        request_id: requestId,
        decision,
        ...(financeEntry && {
          finance_entry_id: financeEntry.id,
          commission_earned: financeEntry.commission_earned,
        }),
      });

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[admin/requests/:id/decision]', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  });


  return router;
};
