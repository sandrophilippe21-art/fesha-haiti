const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs'); 
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'directeur';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {recursive: true});
const db = new Database(path.join(__dirname, 'data', 'fesha.db')); 
db.exec(`CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  discipline TEXT NOT NULL,
  emergency_contact TEXT,
  emergency_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 } }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login');
}

app.post('/api/register', (req, res) => {
  const { first_name, last_name, birth_date, phone, email, address, discipline, emergency_contact, emergency_phone, message } = req.body;
  if (!first_name || !last_name || !phone || !discipline) return res.status(400).json({ ok:false, message:'Veuillez remplir les champs obligatoires.' });
  const stmt = db.prepare(`INSERT INTO registrations (first_name,last_name,birth_date,phone,email,address,discipline,emergency_contact,emergency_phone,message) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const info = stmt.run(first_name.trim(), last_name.trim(), birth_date || '', phone.trim(), (email || '').trim(), (address || '').trim(), discipline, (emergency_contact || '').trim(), (emergency_phone || '').trim(), (message || '').trim());
  res.json({ ok:true, id:info.lastInsertRowid });
});

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});
app.post('/admin/login', (req, res) => {
  if (req.body.username === ADMIN_USERNAME && req.body.password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.status(401).sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});
app.post('/admin/logout', requireAdmin, (req,res)=>req.session.destroy(()=>res.redirect('/')));

app.get('/admin', requireAdmin, (req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.get('/api/admin/registrations', requireAdmin, (req,res)=>{
  const rows = db.prepare('SELECT * FROM registrations ORDER BY id DESC').all();
  res.json(rows);
});
app.patch('/api/admin/registrations/:id', requireAdmin, (req,res)=>{
  const allowed = ['Nouvelle','En cours','Traitée','Archivée'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ok:false});
  db.prepare('UPDATE registrations SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ok:true});
});
app.get('/api/admin/export.csv', requireAdmin, (req,res)=>{
  const rows = db.prepare('SELECT id,first_name,last_name,birth_date,phone,email,address,discipline,emergency_contact,emergency_phone,message,status,created_at FROM registrations ORDER BY id DESC').all();
  const headers = Object.keys(rows[0] || {id:'',first_name:'',last_name:'',birth_date:'',phone:'',email:'',address:'',discipline:'',emergency_contact:'',emergency_phone:'',message:'',status:'',created_at:''});
  const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="fehsa-inscriptions.csv"');
  res.send('\ufeff'+csv);
});

app.listen(PORT, ()=>console.log(`FEHSA running on http://localhost:${PORT}`));
