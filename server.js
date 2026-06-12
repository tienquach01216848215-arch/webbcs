const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Dùng SQLite chạy online không cần SQL Server
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Tự động tạo hoặc kết nối vào file database ngay trên host online
const db = new sqlite3.Database(path.join(__dirname, 'webbanbcs.db'), (err) => {
    if (err) console.error('Lỗi kết nối DB:', err.message);
    else console.log('✅ Đã kết nối Database SQLite Online thành công!');
});

// Tự động tạo các bảng dữ liệu nếu chưa có
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

// Cấu hình CORS để giao diện nhận dữ liệu mượt mà
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'addmin.html')));

// API gửi yêu cầu tư vấn
app.post('/api/counseling/request', (req, res) => {
    const { customerName, customerPhone, productNeed } = req.body;
    const now = new Date().toLocaleString('vi-VN');
    db.run(`INSERT INTO TuVan (customerName, customerPhone, productNeed, createdAt) VALUES (?, ?, ?, ?)`,
        [customerName, customerPhone, productNeed || 'Cần tư vấn kín đáo', now], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "Gửi yêu cầu tư vấn thành công!" });
        });
});

// API đặt hàng nhanh
app.post('/api/checkout', (req, res) => {
    const { customerName, customerPhone, customerAddress, cartItems } = req.body;
    const now = new Date().toLocaleString('vi-VN');
    let dsSanPham = cartItems.map(item => `${item.title} (SL: ${item.quantity})`).join(', ');
    db.run(`INSERT INTO DonHang (customerName, customerPhone, customerAddress, cartItems, createdAt) VALUES (?, ?, ?, ?, ?)`,
        [customerName, customerPhone, customerAddress, dsSanPham, now], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ message: "Đặt hàng thành công!" });
        });
});

// API lấy danh sách đơn hàng cho admin
app.get('/api/checkout', (req, res) => {
    db.all(`SELECT customerName, customerPhone, customerAddress, cartItems FROM DonHang ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json([]);
        let orders = rows.map(row => ({
            customerName: row.customerName,
            customerPhone: row.customerPhone,
            customerAddress: row.customerAddress,
            cartItems: [{ title: row.cartItems, quantity: 1 }]
        }));
        res.json(orders);
    });
});

// API lấy danh sách tư vấn cho admin
app.get('/api/counseling/request', (req, res) => {
    db.all(`SELECT customerName, customerPhone, productNeed FROM TuVan ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});

app.listen(PORT, () => console.log(`🚀 Server online đang chạy tại cổng ${PORT}`));