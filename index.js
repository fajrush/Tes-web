const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.')); // Melayani file statis seperti admin.html

// Penyimpanan konfigurasi sementara di RAM server (Vercel Serverless Friendly)
let globalConfig = {
    midtrans: { active: false, server_key: "" },
    bca: { active: false, norek: "", an: "" }
};

// 1. Endpoint Admin Panel untuk Menyimpan Konfigurasi
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

// 2. Endpoint Mengambil Konfigurasi saat ini
app.get('/api/admin/config', (req, res) => {
    return res.json(globalConfig);
});

// 3. Webhook Penerima Notifikasi Pembayaran Sukses (Dari Midtrans/Tripay)
app.post('/api/webhook', async (req, res) => {
    const { order_id, transaction_status, gross_amount, customer_phone } = req.body;

    // Logika deteksi otomatis status transaksi berhasil
    if (transaction_status === 'settlement' || transaction_status === 'capture' || req.body.status === 'success') {
        
        const nominal = gross_amount || req.body.amount || "0";
        const phone = customer_phone || req.body.phone;
        const idOrder = order_id || req.body.order_id;
        
        // Desain pesan WhatsApp otomatis pakai huruf tebal (bold)
        const pesanWhatsApp = `*PEMBAYARAN SUKSES*\\n\\nHalo! Terima kasih, pembayaran untuk Order *#${idOrder}* sebesar *Rp ${parseInt(nominal).toLocaleString('id-ID')}* telah kami terima.\\n\\nStatus pesanan Anda saat ini sedang diproses secara otomatis.`;

        console.log(`[INFO] Memicu pengiriman WhatsApp ke ${phone}`);
        
        // Kirim instruksi pesan teks ke Bot WhatsApp yang standby di HP Termux/VPS lu
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

// Berjalan secara lokal jika tidak memakai sistem production cloud Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server uji coba berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;
