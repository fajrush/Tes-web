const express = require('express');
const app = express();

app.use(express.json());

let globalConfig = {
    midtrans: { active: false, server_key: "" },
    bca: { active: false, norek: "", an: "" }
};

// 1. HALAMAN UTAMA
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistem Pembayaran Otomatis</title>
        <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f6f9; }
            .card { background: white; padding: 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            a { display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold;}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🚀 Server Pembayaran Aktif!</h2>
            <p>Klik tombol di bawah untuk mengatur metode pembayaran:</p>
            <a href="/admin">Masuk ke Admin Panel</a>
        </div>
    </body>
    </html>
    `);
});

// 2. HALAMAN ADMIN PANEL
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Panel - Pengaturan Pembayaran</title>
        <style>
            body { font-family: -apple-system, sans-serif; background-color: #f4f6f9; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; font-weight: bold; }
            input[type="text"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { background-color: #0070f3; color: white; border: none; padding: 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; font-size: 16px; }
        </style>
    </head>
    <body>
    <div class="container">
        <h2>⚙️ Admin Panel Payment</h2>
        <div class="form-group">
            <label>Password Admin:</label>
            <input type="password" id="admin_password" placeholder="Masukkan password admin">
        </div>
        <hr>
        <h3>Midtrans Gateway</h3>
        <input type="checkbox" id="midtrans_active"> Aktifkan Midtrans
        <div class="form-group"><br>
            <label>Server Key Midtrans:</label>
            <input type="text" id="midtrans_key">
        </div>
        <h3>BCA Manual</h3>
        <input type="checkbox" id="bca_active"> Aktifkan BCA
        <div class="form-group"><br>
            <label>No Rekening:</label>
            <input type="text" id="bca_norek">
        </div>
        <button onclick="simpan()">Simpan Setelan</button>
        <p id="info" style="text-align:center; font-weight:bold;"></p>
    </div>
    <script>
        async function simpan() {
            const data = {
                password: document.getElementById('admin_password').value,
                settings: {
                    midtrans: { active: document.getElementById('midtrans_active').checked, server_key: document.getElementById('midtrans_key').value },
                    bca: { active: document.getElementById('bca_active').checked, norek: document.getElementById('bca_norek').value }
                }
            };
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            document.getElementById('info').innerText = result.message;
        }
    </script>
    </body>
    </html>
    `);
});

// 3. API Simpan Config
app.post('/api/admin/config', (req, res) => {
    const { password, settings } = req.body;
    const securePassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (password !== securePassword) {
        return res.status(401).json({ status: 'error', message: '❌ Password Admin Salah!' });
    }
    globalConfig = settings;
    return res.json({ status: 'success', message: '✅ Konfigurasi berhasil disimpan!' });
});

// 4. Webhook Pembayaran
app.post('/api/webhook', async (req, res) => {
    return res.status(200).send('OK');
});

module.exports = app;
