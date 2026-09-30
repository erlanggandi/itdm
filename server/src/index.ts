import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDb,
  getDb,
  getStats,
  getEmployees,
  createEmployee,
  createEmployeesBulk,
  updateEmployee,
  deleteEmployee,
  getEmailAccounts,
  createEmailAccount,
  createEmailAccountsBulk,
  updateEmailAccount,
  deleteEmailAccount,
  getHotspotAccounts,
  createHotspotAccount,
  createHotspotAccountsBulk,
  updateHotspotAccount,
  deleteHotspotAccount,
  getSettings,
  updateSettings,
  restoreDatabase,
  resetToDefaults,
  clearDatabase,
  logActivity,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Database
initDb();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'IT Data Platform API', time: new Date().toISOString() });
});

// STATS
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// EMPLOYEES
app.get('/api/employees', (req: Request, res: Response) => {
  try {
    const employees = getEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', (req: Request, res: Response) => {
  try {
    const employee = createEmployee(req.body);
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees/bulk', (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.employees) ? req.body.employees : [];
    const created = createEmployeesBulk(rows);
    res.status(201).json({ created, count: created.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', (req: Request, res: Response) => {
  try {
    const updated = updateEmployee(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', (req: Request, res: Response) => {
  try {
    const success = deleteEmployee(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Karyawan berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// EMAIL ACCOUNTS
app.get('/api/emails', (req: Request, res: Response) => {
  try {
    const emails = getEmailAccounts();
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emails', (req: Request, res: Response) => {
  try {
    const newEmail = createEmailAccount(req.body);
    res.status(201).json(newEmail);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emails/bulk', (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.emails) ? req.body.emails : [];
    const created = createEmailAccountsBulk(rows);
    res.status(201).json({ created, count: created.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/emails/:id', (req: Request, res: Response) => {
  try {
    const updated = updateEmailAccount(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Akun email tidak ditemukan' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/emails/:id', (req: Request, res: Response) => {
  try {
    const success = deleteEmailAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Akun email tidak ditemukan' });
    }
    res.json({ success: true, message: 'Akun email berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// HOTSPOT ACCOUNTS
app.get('/api/hotspots', (req: Request, res: Response) => {
  try {
    const hotspots = getHotspotAccounts();
    res.json(hotspots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hotspots', (req: Request, res: Response) => {
  try {
    const newHotspot = createHotspotAccount(req.body);
    res.status(201).json(newHotspot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hotspots/bulk', (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.hotspots) ? req.body.hotspots : [];
    const created = createHotspotAccountsBulk(rows);
    res.status(201).json({ created, count: created.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/hotspots/:id', (req: Request, res: Response) => {
  try {
    const updated = updateHotspotAccount(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Akun hotspot tidak ditemukan' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/hotspots/:id', (req: Request, res: Response) => {
  try {
    const success = deleteHotspotAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Akun hotspot tidak ditemukan' });
    }
    res.json({ success: true, message: 'Akun hotspot berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SETTINGS
app.get('/api/settings', (req: Request, res: Response) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LOGS
app.get('/api/logs', (req: Request, res: Response) => {
  try {
    const db = getDb();
    res.json(db.logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BACKUP FULL JSON DOWNLOAD
app.get('/api/backup', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup_itdm_${dateStr}_${Date.now()}.json`;

    logActivity('BACKUP', 'DATABASE', `Mengunduh file backup database lengkap (${fileName})`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(db, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESTORE FULL JSON
app.post('/api/restore', (req: Request, res: Response) => {
  try {
    const restoredData = req.body;
    const result = restoreDatabase(restoredData);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ success: true, message: result.message, stats: getStats() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESET TO SAMPLE
app.post('/api/reset', (req: Request, res: Response) => {
  try {
    resetToDefaults();
    res.json({ success: true, message: 'Database berhasil direset ke data awal' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CLEAR ENTIRE DATABASE (keep settings)
app.post('/api/clear', (req: Request, res: Response) => {
  try {
    const counts = clearDatabase();
    res.json({ success: true, message: 'Database dikosongkan', counts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if exists
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('IT Data Platform Backend API is running on port ' + PORT);
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[IT Data Platform] Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
