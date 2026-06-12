const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Cấu hình nhận dữ liệu từ form và JSON mượt mà
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SỬA LỖI HIỂN THỊ ẢNH: Cấu hình chuẩn xác quyền truy cập thư mục gốc và thư mục public trên Render
app.use(express.static(__dirname)); 
app.use('/public', express.static('public'));

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
    // Tạo bảng lưu yêu cầu tư vấn ẩn danh
    db.run(`CREATE TABLE IF NOT EXISTS TuVan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        customerPhone TEXT,
        productNeed TEXT,
        createdAt TEXT
    )`);

    // Tạo bảng lưu đơn đặt hàng nhanh công khai
    db.run(`CREATE TABLE IF NOT EXISTS DonHang (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        customerPhone TEXT,
        customerAddress TEXT,
        cartItems TEXT,
        createdAt TEXT
    )`);
});

// Cấu hình CORS để giao diện nhận dữ liệu mượt mà không bị chặn bảo mật
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Điều hướng trang chủ bán hàng cho khách truy cập
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Điều hướng trang quản trị đơn hàng cho Dược sĩ Vỹ
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'addmin.html'));
});

// ==================== HỆ THỐNG API XỬ LÝ DỮ LIỆU ====================

// 1. API nhận yêu cầu tư vấn bảo mật từ trang chủ
app.post('/api/counseling/request', (req, res) => {
    const { customerName, customerPhone, productNeed } = req.body;
    const now = new Date().toLocaleString('vi-VN');
    
    db.run(`INSERT INTO TuVan (customerName, customerPhone, productNeed, createdAt) VALUES (?, ?, ?, ?)`,
        [customerName, customerPhone, productNeed || 'Cần tư vấn kín đáo', now], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "Gửi yêu cầu tư vấn thành công!" });
        });
});

// 2. API lấy danh sách yêu cầu tư vấn hiển thị lên trang admin
app.get('/api/counseling/list', (req, res) => {
    db.all(`SELECT * FROM TuVan ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).
