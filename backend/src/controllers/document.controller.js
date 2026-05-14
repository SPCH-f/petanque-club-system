const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const documentService = require('../services/documentService');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getTemplates = async (req, res) => {
  try {
    const [templates] = await db.query(
      'SELECT * FROM document_templates WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );

    // Parse fields JSON for each template
    const formattedTemplates = templates.map(t => ({
      ...t,
      fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields
    }));

    return sendSuccess(res, formattedTemplates);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดึงข้อมูลเทมเพลต');
  }
};

const getTemplate = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM document_templates WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    const template = rows[0];
    if (!template) return sendError(res, 404, 'ไม่พบเทมเพลต');

    template.fields = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields;

    return sendSuccess(res, template);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;
    const file = req.file;

    if (!name || !file || !fields) {
      console.log('Validation Failed:', {
        hasName: !!name,
        hasFile: !!file,
        hasFields: !!fields,
        fieldsType: typeof fields
      });
      return sendError(res, 422, 'กรุณากรอกข้อมูลให้ครบถ้วนและอัปโหลดไฟล์');
    }

    const id = uuidv4();
    const filePath = file.path; // Already handled by multer

    await db.query(
      'INSERT INTO document_templates (id, name, description, file_path, fields) VALUES (?, ?, ?, ?, ?)',
      [id, name, description || '', filePath, fields] // fields is already a JSON string from frontend or parsed
    );

    return sendSuccess(res, { id }, 'เพิ่มเทมเพลตสำเร็จ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการบันทึกเทมเพลต');
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;
    const file = req.file;
    const { id } = req.params;

    const [existing] = await db.query('SELECT file_path FROM document_templates WHERE id = ?', [id]);
    if (existing.length === 0) return sendError(res, 404, 'ไม่พบเทมเพลต');

    const filePath = file ? file.path : existing[0].file_path;

    await db.query(
      'UPDATE document_templates SET name = ?, description = ?, file_path = ?, fields = ? WHERE id = ?',
      [name, description || '', filePath, fields, id]
    );

    return sendSuccess(res, null, 'อัปเดตเทมเพลตสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการอัปเดตเทมเพลต');
  }
};

const generateDocument = async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const { requestId } = req.query;
    let userId = req.user.id;

    // If downloading existing request, use the original applicant's ID
    if (requestId) {
      const [reqRows] = await db.query('SELECT user_id FROM generated_documents WHERE id = ?', [requestId]);
      if (reqRows[0]) userId = reqRows[0].user_id;
    }

    const [rows] = await db.query(
      'SELECT * FROM document_templates WHERE id = ? AND deleted_at IS NULL',
      [templateId]
    );
    const template = rows[0];
    if (!template) return sendError(res, 404, 'ไม่พบเทมเพลต');

    console.log('Generating document for template:', templateId);

    // 1. Prepare data with signatures and automatic fields
    const now = new Date();
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const mergedData = {
      ...(data && typeof data === 'object' ? data : {}),
      // Default dates (Borrow Phase)
      bd: now.getDate(),
      bm: thaiMonths[now.getMonth()],
      by: now.getFullYear() + 543,
      // Fallback for single-phase tags
      d: now.getDate(),
      m: thaiMonths[now.getMonth()],
      y: now.getFullYear() + 543,
      // Initialize return phase as empty
      rd: '', rm: '', ry: '',
      ruser: '', 'rposition': '', 'rn-user': '',
      rad1: '', rad2: '', rad3: '', rad4: ''
    };

    // Handle Title Selection Highlight (prefix -> prefix_display)
    if (mergedData.prefix) {
      const p = mergedData.prefix;
      const mr = p === 'นาย' ? '[นาย]' : 'นาย';
      const mrs = p === 'นาง' ? '[นาง]' : 'นาง';
      const ms = p === 'นางสาว' ? '[นางสาว]' : 'นางสาว';
      mergedData.prefix_display = `( ${mr} / ${mrs} / ${ms} )`;
    } else {
      mergedData.prefix_display = `( นาย / นาง / นางสาว )`;
    }

    // Auto-add index 'i' to any array fields for table numbering
    Object.keys(mergedData).forEach(key => {
      if (Array.isArray(mergedData[key])) {
        mergedData[key] = mergedData[key].map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            return { ...item, i: index + 1 };
          }
          return item;
        });
      }
    });

    // Handle Checkboxes and Dates
    if (template.fields) {
      let fieldsArray = [];
      try {
        fieldsArray = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields;
      } catch (e) {
        console.error('Failed to parse template fields:', e);
      }

      if (Array.isArray(fieldsArray)) {
        fieldsArray.forEach(field => {
          if (field.type === 'date' && mergedData[field.name]) {
            const d = new Date(mergedData[field.name]);
            if (!isNaN(d.getTime())) {
              const day = d.getDate();
              const month = thaiMonths[d.getMonth()];
              const year = d.getFullYear() + 543;
              
              if (field.name.toLowerCase().startsWith('s')) {
                mergedData.sd = day;
                mergedData.sm = month;
                mergedData.sy = year;
              } else if (field.name.toLowerCase().startsWith('e')) {
                mergedData.ed = day;
                mergedData.em = month;
                mergedData.ey = year;
              }
            }
          }

          if (field.type === 'checkbox') {
            if (!mergedData[field.name]) {
              mergedData[field.name] = '☐';
            } else if (mergedData[field.name] === true || mergedData[field.name] === 'true' || mergedData[field.name] === '1') {
              mergedData[field.name] = '✓';
            }
          }
        });
      }
    }

    // Add user signature (Borrow Phase)
    const [userRows] = await db.query('SELECT first_name, last_name, signature_url FROM users WHERE id = ?', [userId]);
    if (userRows[0]?.signature_url) {
      const sigPath = path.join(__dirname, '../../', userRows[0].signature_url);
      try {
        if (fsSync.existsSync(sigPath)) {
          mergedData.buser = sigPath;
        }
      } catch (e) {}
    }
    const profileName = userRows[0] ? `${userRows[0].first_name} ${userRows[0].last_name}` : '';
    if (!mergedData['n-user']) mergedData['n-user'] = profileName;
    if (!mergedData['full_name']) mergedData['full_name'] = mergedData['n-user'];

    // If it's a request being viewed/downloaded, add admin signatures and return phase data
    if (requestId) {
      const [reqRows] = await db.query('SELECT admin_approvals, return_approvals, return_details, status FROM generated_documents WHERE id = ?', [requestId]);
      const request = reqRows[0];
      
      // Phase 1: Borrow Approvals
      let borrowApprovals = request?.admin_approvals || {};
      if (typeof borrowApprovals === 'string') {
        try { borrowApprovals = JSON.parse(borrowApprovals); } catch (e) { borrowApprovals = {}; }
      }

      const roles = {
        approver: 'ad1',
        advisor1: 'ad2',
        advisor2: 'ad3',
        president: 'ad4'
      };

      // Fill Borrow Signatures (bad1, bad2, ...)
      for (const [role, suffix] of Object.entries(roles)) {
        if (borrowApprovals[role]?.signature) {
          const sigPath = path.join(__dirname, '../../', borrowApprovals[role].signature);
          try {
            if (fsSync.existsSync(sigPath)) {
              mergedData[`b${suffix}`] = sigPath;
            }
          } catch (e) {}
        }
      }

      // Phase 2: Return Phase (ONLY if status is returning or completed)
      if (request.status === 'returning' || request.status === 'completed') {
        let returnApprovals = request?.return_approvals || {};
        if (typeof returnApprovals === 'string') {
          try { returnApprovals = JSON.parse(returnApprovals); } catch (e) { returnApprovals = {}; }
        }

        let returnDetails = request?.return_details || {};
        if (typeof returnDetails === 'string') {
          try { returnDetails = JSON.parse(returnDetails); } catch (e) { returnDetails = {}; }
        }

        // Fill Return Signatures (rad1, rad2, ...)
        for (const [role, suffix] of Object.entries(roles)) {
          if (returnApprovals[role]?.signature) {
            const sigPath = path.join(__dirname, '../../', returnApprovals[role].signature);
            try {
              if (fsSync.existsSync(sigPath)) {
                mergedData[`r${suffix}`] = sigPath;
              }
            } catch (e) {}
          }
        }

        // Fill Return User Data (ruser, rn-user, rp-user)
        if (returnDetails.signature) {
          const sigPath = path.join(__dirname, '../../', returnDetails.signature);
          try {
            if (fsSync.existsSync(sigPath)) {
              mergedData.ruser = sigPath;
            }
          } catch (e) {}
        }
        
        // Use rn-user as shown in image
        mergedData['rn-user'] = userRows[0] ? `${userRows[0].first_name} ${userRows[0].last_name}` : '';
        
        if (returnDetails.position) {
          mergedData['rposition'] = returnDetails.position;
        }

        // Set Return Date
        const rDate = returnDetails.returnedAt ? new Date(returnDetails.returnedAt) : now;
        mergedData.rd = rDate.getDate();
        mergedData.rm = thaiMonths[rDate.getMonth()];
        mergedData.ry = rDate.getFullYear() + 543;
      }
    }

    console.log('Template found:', template.name, 'Path:', template.file_path);

    // 2. Generate DOCX
    const docxBuffer = await documentService.generateDocx(template.file_path, mergedData);
    console.log('DOCX generated successfully, buffer size:', docxBuffer.length);

    // If we are just downloading/previewing an existing request, don't insert a new row
    if (requestId) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(template.name.replace(/\s+/g, '_'))}.docx`);
      return res.send(docxBuffer);
    }

    // 2. Save new record (only for new submissions/generations)
    const genId = uuidv4();
    const fileName = `doc_${genId}.docx`;
    const outputPath = path.join(__dirname, '../../uploads/generated', fileName);

    await documentService.ensureUploadDirs();
    await fs.writeFile(outputPath, docxBuffer);
    console.log('DOCX saved to:', outputPath);

    await db.query(
      'INSERT INTO generated_documents (id, template_id, user_id, data, pdf_path) VALUES (?, ?, ?, ?, ?)',
      [genId, templateId, userId, JSON.stringify(data), outputPath]
    );

    // 3. Send the file back to the user
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(template.name.replace(/\s+/g, '_'))}.docx`);
    return res.send(docxBuffer);

  } catch (err) {
    console.error('GENERATE ERROR:', err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการสร้างเอกสาร: ' + err.message);
  }
};

const previewDocument = async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const userId = req.user.id;

    if (!templateId) return sendError(res, 400, 'ไม่พบรหัสเทมเพลต');

    const [rows] = await db.query(
      'SELECT * FROM document_templates WHERE id = ? AND deleted_at IS NULL',
      [templateId]
    );
    const template = rows[0];
    if (!template) return sendError(res, 404, 'ไม่พบเทมเพลต');

    // 1. Prepare data (similar to generateDocument)
    const now = new Date();
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const mergedData = {
      ...(data && typeof data === 'object' ? data : {}),
      d: now.getDate(),
      m: thaiMonths[now.getMonth()],
      y: now.getFullYear() + 543
    };

    // Auto-add index 'i' to any array fields for table numbering
    Object.keys(mergedData).forEach(key => {
      if (Array.isArray(mergedData[key])) {
        mergedData[key] = mergedData[key].map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            return { ...item, i: index + 1 };
          }
          return item;
        });
      }
    });

    // Handle Checkboxes: Fill missing checkbox fields with '☐'
    if (template.fields) {
      let fieldsArray = [];
      try {
        fieldsArray = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields;
      } catch (e) {
        console.error('Failed to parse template fields:', e);
      }

      if (Array.isArray(fieldsArray)) {
        fieldsArray.forEach(field => {
          if (field.type === 'checkbox') {
            if (!mergedData[field.name]) {
              mergedData[field.name] = '☐';
            } else if (mergedData[field.name] === true || mergedData[field.name] === 'true' || mergedData[field.name] === '1') {
              mergedData[field.name] = '✓';
            }
          }
        });
      }
    }

    // Add user signature
    const [userRows] = await db.query('SELECT first_name, last_name, signature_url FROM users WHERE id = ?', [userId]);
    if (userRows[0]?.signature_url) {
      const sigPath = path.join(__dirname, '../../', userRows[0].signature_url);
      try {
        if (fsSync.existsSync(sigPath)) {
          mergedData.user = sigPath;
        }
      } catch (e) {
        console.warn('Preview signature file check failed:', e.message);
      }
    }
    mergedData.n_user = userRows[0] ? `${userRows[0].first_name} ${userRows[0].last_name}` : '';

    // 2. Generate PDF using service
    // Note: PDF generation is slower than DOCX
    const pdfBuffer = await documentService.generatePdfFromDocx(template.file_path, mergedData);

    // 3. Send PDF buffer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=preview.pdf');
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('PREVIEW ERROR:', err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการสร้างตัวอย่าง: ' + err.message);
  }
};

const deleteTemplate = async (req, res) => {
  try {
    await db.query('UPDATE document_templates SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return sendSuccess(res, null, 'ลบเทมเพลตสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการลบเทมเพลต');
  }
};

const getRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = `
      SELECT gd.*, u.first_name as user_name, t.name as template_name, t.fields as template_fields
      FROM generated_documents gd
      JOIN users u ON gd.user_id = u.id
      JOIN document_templates t ON gd.template_id = t.id
      WHERE gd.status = ?
      ORDER BY gd.created_at DESC
    `;
    const [rows] = await db.query(query, [status || 'pending']);
    return sendSuccess(res, rows);
  } catch (err) {
    console.error('GET REQUESTS ERROR:', err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check admin role
    const [adminRows] = await db.query('SELECT signature_role, signature_url FROM users WHERE id = ?', [adminId]);
    const admin = adminRows[0];

    if (!admin || admin.signature_role === 'none') {
      return sendError(res, 403, 'คุณไม่มีสิทธิ์ในการลงลายเซ็น (กรุณาตั้งค่า Signature Role ในโปรไฟล์)');
    }

    if (!admin.signature_url) {
      return sendError(res, 400, 'คุณยังไม่มีลายเซ็นในระบบ กรุณาอัปโหลดลายเซ็นก่อน');
    }

    // Get current request
    const [reqRows] = await db.query('SELECT admin_approvals, return_approvals, status FROM generated_documents WHERE id = ?', [id]);
    const request = reqRows[0];

    if (!request) return sendError(res, 404, 'ไม่พบคำร้อง');

    // Decide which approvals to update based on current status
    let approvalsField = 'admin_approvals';
    let approvals = request.admin_approvals || {};
    
    if (request.status === 'returning' || request.status === 'completed') {
      approvalsField = 'return_approvals';
      approvals = request.return_approvals || {};
    }

    if (typeof approvals === 'string') {
      try { approvals = JSON.parse(approvals); } catch (e) { approvals = {}; }
    }

    approvals[admin.signature_role] = {
      adminId,
      signedAt: new Date(),
      signature: admin.signature_url
    };

    // Check if all required roles have signed for this phase
    // (Disabled for testing: Single signature approval)
    // const requiredRoles = ['approver', 'advisor1', 'advisor2', 'president'];
    // const signedRoles = Object.keys(approvals);
    // const isPhaseComplete = requiredRoles.every(role => signedRoles.includes(role));
    
    const isPhaseComplete = true; 


    let newStatus = request.status;
    if (request.status === 'pending' && isPhaseComplete) {
      newStatus = 'borrowed';
    } else if (request.status === 'returning' && isPhaseComplete) {
      newStatus = 'completed';
    }

    await db.query(
      `UPDATE generated_documents SET ${approvalsField} = ?, status = ? WHERE id = ?`,
      [JSON.stringify(approvals), newStatus, id]
    );

    // Notify User
    try {
      const [[tplInfo]] = await db.query(
        'SELECT t.name, gd.user_id FROM generated_documents gd JOIN document_templates t ON gd.template_id = t.id WHERE gd.id = ?',
        [id]
      );
      if (tplInfo) {
        await notificationService.notifyDocumentApproved(tplInfo.user_id, tplInfo.name, isPhaseComplete);
      }
    } catch (notifyErr) {
      console.error('Notify User of Document Approval Error:', notifyErr.message);
    }

    return sendSuccess(res, { isPhaseComplete }, 'ลงลายเซ็นเรียบร้อยแล้ว');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการอนุมัติ');
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE generated_documents SET status = ? WHERE id = ?', ['rejected', id]);

    // Notify User
    try {
      const [[tplInfo]] = await db.query(
        'SELECT t.name, gd.user_id FROM generated_documents gd JOIN document_templates t ON gd.template_id = t.id WHERE gd.id = ?',
        [id]
      );
      if (tplInfo) {
        await notificationService.notifyDocumentRejected(tplInfo.user_id, tplInfo.name);
      }
    } catch (notifyErr) {
      console.error('Notify User of Document Rejection Error:', notifyErr.message);
    }

    return sendSuccess(res, null, 'ปฏิเสธคำร้องเรียบร้อยแล้ว');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

const requestApproval = async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const userId = req.user.id;
    if (!templateId || !data) return sendError(res, 422, 'ข้อมูลไม่ครบถ้วน');

    const id = uuidv4();
    await db.query(
      'INSERT INTO generated_documents (id, template_id, user_id, data, status) VALUES (?, ?, ?, ?, ?)',
      [id, templateId, userId, JSON.stringify(data), 'pending']
    );

    // Notify Admins
    try {
      const [tplRows] = await db.query('SELECT name FROM document_templates WHERE id = ?', [templateId]);
      const templateName = tplRows[0]?.name || 'เอกสารทั่วไป';
      const userName = `${req.user.first_name} ${req.user.last_name}`;
      await notificationService.notifyAdminsOfDocumentRequest(userName, templateName);
    } catch (notifyErr) {
      console.error('Notify Admins of Document Request Error:', notifyErr.message);
    }

    return sendSuccess(res, { id }, 'ส่งคำร้องขออนุมัติเรียบร้อยแล้ว', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการส่งคำร้อง');
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT gd.*, t.name as template_name, t.fields as template_fields
      FROM generated_documents gd
      JOIN document_templates t ON gd.template_id = t.id
      WHERE gd.user_id = ?
      ORDER BY gd.created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return sendSuccess(res, rows);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};

const downloadRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Get request data
    const [reqRows] = await db.query('SELECT * FROM generated_documents WHERE id = ?', [id]);
    const request = reqRows[0];
    if (!request) return sendError(res, 404, 'ไม่พบคำร้อง');

    // Reuse generateDocument logic by manually setting req.body and calling it
    // Or just implement a simplified version here
    const [tplRows] = await db.query('SELECT * FROM document_templates WHERE id = ?', [request.template_id]);
    const template = tplRows[0];

    // Prepare data (signatures are handled inside the service or here)
    // Actually, we already updated generateDocument to check for requestId query param
    // So we can just redirect or call it. 
    // Let's just implement the logic here for clarity

    req.body = {
      templateId: request.template_id,
      data: typeof request.data === 'string' ? JSON.parse(request.data) : request.data
    };
    req.query.requestId = id;

    return generateDocument(req, res);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดาวน์โหลด');
  }
};

const requestReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, position } = req.body;
    const userId = req.user.id;

    const [reqRows] = await db.query('SELECT status, user_id FROM generated_documents WHERE id = ?', [id]);
    const request = reqRows[0];

    if (!request) return sendError(res, 404, 'ไม่พบคำร้อง');
    if (request.user_id !== userId) return sendError(res, 403, 'คุณไม่มีสิทธิ์แจ้งคืนสำหรับคำร้องนี้');
    
    // Support both 'borrowed' and 'approved' (legacy)
    if (request.status !== 'borrowed' && request.status !== 'approved') {
      return sendError(res, 400, 'คำร้องนี้ไม่ได้อยู่ในสถานะกำลังยืม');
    }

    // Use provided signature or user's profile signature
    let returnSignature = signature;
    if (!returnSignature) {
      const [u] = await db.query('SELECT signature_url FROM users WHERE id = ?', [userId]);
      returnSignature = u[0]?.signature_url;
    }

    const returnDetails = {
      signature: returnSignature, 
      position,
      returnedAt: new Date()
    };

    await db.query(
      'UPDATE generated_documents SET status = ?, return_details = ? WHERE id = ?',
      ['returning', JSON.stringify(returnDetails), id]
    );

    // Notify Admins
    try {
      await notificationService.notifyReturnRequested(id);
    } catch (e) {
      console.error('Notify Return Error:', e.message);
    }

    return sendSuccess(res, null, 'แจ้งคืนพัสดุเรียบร้อยแล้ว รอการตรวจสอบจากคณะกรรมการ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการแจ้งคืน');
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  generateDocument,
  requestApproval,
  getRequests,
  getMyRequests,
  downloadRequest,
  approveRequest,
  rejectRequest,
  deleteTemplate,
  previewDocument,
  requestReturn
};
