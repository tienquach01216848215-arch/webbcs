const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // Thư viện kiểm tra file hệ thống
const app = express();
const PORT = process.env.PORT || 10000;

// Cấu hình nhận dữ liệu form và JSON cực kỳ quan trọng
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép truy cập trực tiếp các file ở thư mục gốc
app.use(express.static(__dirname));

// Kết nối hoặc tự động tạo cơ sở dữ liệu SQLite Online
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('❌ Lỗi kết nối Database:', err.message);
    } else {
        console.log('✅ Đã kết nối Database SQLite Online thành công!');
    }
});

// Tự động tạo bảng lưu dữ liệu nếu chưa có
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS TuVan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        customerPhone TEXT,
        productNeed TEXT,
        createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS DonHang (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        customerPhone TEXT,
        customerAddress TEXT,
        cartItems TEXT,
        createdAt TEXT
    )`);
});

// Cấu hình CORS bảo mật nhận dữ liệu mượt mà
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Điều hướng trang chủ công khai
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SỬA LỖI NOT FOUND: Tự động quét tìm file admin.html hoặc addmin.html để hiển thị công khai
app.get('/admin', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'admin.html'))) {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else if (fs.existsSync(path.join(__dirname, 'addmin.html'))) {
        res.sendFile(path.join(__dirname, 'addmin.html'));
    } else {
        res.status(404).send('❌ Lỗi: Server không tìm thấy file admin.html hoặc addmin.html ở thư mục gốc của bạn!');
    }
});

// ==================== HỆ THỐNG API XỬ LÝ DỮ LIỆU ====================

app.post('/api/counseling/request', (req, res) => {
    const { customerName, customerPhone, productNeed } = req.body;
    const now = new Date().toLocaleString('vi-VN');
    
    db.run(`INSERT INTO TuVan (customerName, customerPhone, productNeed, createdAt) VALUES (?, ?, ?, ?)`,
        [customerName, customerPhone, productNeed || 'Cần tư vấn kín đáo', now], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "Gửi yêu cầu tư vấn thành công!" });
        });
});

app.get('/api/counseling/list', (req, res) => {
    db.all(`SELECT * FROM TuVan ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json(rows);
    });
});

app.post('/api/checkout', (req, res) => {
    const { customerName, customerPhone, customerAddress, cartItems } = req.body;
    const now = new Date().toLocaleString('vi-VN');
    let dsSanPham = cartItems.map(item => `${item.title} (SL: ${item.quantity})`).join(', ');

    db.run(`INSERT INTO DonHang (customerName, customerPhone, customerAddress, cartItems, createdAt) VALUES (?, ?, ?, ?, ?)`,
        [customerName, customerPhone, customerAddress, dsSanPham, now], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "Đặt hàng thành công! Dược sĩ Vỹ sẽ sớm liên hệ giao hàng." });
        });
});

app.get('/api/orders/list', (req, res) => {
    db.all(`SELECT * FROM DonHang ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json(rows);
    });
});

// Kích hoạt Server lắng nghe cổng kết nối
app.listen(PORT, () => {
    console.log('🚀 Server online đang chạy mượt mà!');
});
