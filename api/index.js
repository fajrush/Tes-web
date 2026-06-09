const express = require('express');
const path = require('path'); // Library bawaan Node.js untuk mengatur folder
const app = express();

app.use(express.json());

// PERBAIKAN UTAMA: Menyuruh Vercel membaca file HTML di luar folder 'api' dengan benar
app.use(express.static(path.join(__dirname, '../')));

// Tempat penyimpanan konfigurasi sementara di RAM server
let globalConfig = {
    midtrans: { active: false, server_key: "" },
    bca: { active: false, norek: "", an: "" }
};

// 1. Endpoint untuk menampilkan halaman utama (index.html) pas diakses di link utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 2. Endpoint untuk menampilkan halaman Admin Panel (admin.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

// 3. Endpoint Admin Panel untuk Menyimpan Konfigurasi dari Form
app.post('/api/admin/config', (req, res) => {
    const { password, settings } = req.body;
    
    // Membaca password admin aman dari environment variables Vercel (Default: admin123)
    const securePassword = process.env.ADMIN_PASSWORD || "admin123";
    if (password !== securePassword) {
        return res.status(401).json({ status: 'error', message: 'Password Admin Salah!' });
    }

    if (!settings) {
        return res.status(400).json({ status: 'error', message: 'Data setting kosong!' });
    }

    globalConfig = settings;
    console.log("Konfigurasi baru disimpan:", globalConfig);
    
    return res.json({ status: 'success', message: 'Konfigurasi diperbarui', data: globalConfig });
});

// 4. Endpoint Mengambil Konfigurasi saat ini
app.get('/api/admin/config', (req, res) => {
    return res.json(globalConfig);
});

// 5. Webhook Penerima Notifikasi Pembayaran Sukses (Dari Midtrans/Tripay)
app.post('/api/webhook', async (req, res) => {
    const { order_id, transaction_status, gross_amount, customer_phone } = req.body;

    if (transaction_status === 'settlement' || transaction_status === 'capture' || req.body.status === 'success') {
        
        const nominal = gross_amount || req.body.amount || "0";
        const phone = customer_phone || req.body.phone;
        const idOrder = order_id || req.body.order_id;
        
        const pesanWhatsApp = `*PEMBAYARAN SUKSES*\n\nHalo! Terima kasih, pembayaran untuk Order *#${idOrder}* sebesar *Rp ${parseInt(nominal).toLocaleString('id-ID')}* telah kami terima.\n\nStatus pesanan Anda saat ini sedang diproses secara otomatis.`;

        console.log(`[INFO] Memicu pengiriman WhatsApp ke ${phone}`);
        
        // Meneruskan perintah kirim pesan ke Bot WhatsApp Termux HP lu
        try {
            const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
            if (gatewayUrl) {
                await fetch(gatewayUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phone, message: pesanWhatsApp })
                });
                console.log("[WA] Sukses meneruskan perintah ke Bot WA lokal.");
            } else {
                console.log("[WA-WARNING] Alamat WHATSAPP_GATEWAY_URL belum di-setting di Vercel.");
            }
        } catch (err) {
            console.error("[WA-ERROR] Gagal meneruskan ke Bot WA:", err.message);
        }
    }

    return res.status(200).send('OK Webhook Diterima');
});

// Berjalan secara lokal jika tidak di cloud Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server uji coba berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;
