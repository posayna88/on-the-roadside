const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔐 Admin Login
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if(username === ADMIN_USER && password === ADMIN_PASS){
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// 📁 uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ⚙️ multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// 📂 orders
const DATA_FILE = "orders.json";

function getOrders(){
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveOrders(data){
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 📥 إضافة طلب
app.post("/api/order", upload.fields([
    { name: "frontImg" },
    { name: "backImg" },
    { name: "rightImg" },
    { name: "leftImg" }
]), (req, res) => {

    const orders = getOrders();

    const newOrder = {
        id: Date.now(),
        phone: req.body.phone,
        service: req.body.service,
        problem: req.body.problem,
        location: req.body.location,
        status: "جديد",
        driver: null,
        images: {
            front: req.files.frontImg?.[0]?.filename || null,
            back: req.files.backImg?.[0]?.filename || null,
            right: req.files.rightImg?.[0]?.filename || null,
            left: req.files.leftImg?.[0]?.filename || null
        },
        date: new Date()
    };

    orders.push(newOrder);
    saveOrders(orders);

    res.json({ success: true });
});

// 📊 عرض الطلبات
app.get("/api/orders", (req, res) => {
    res.json(getOrders());
});

// 🔄 تغيير الحالة
app.post("/api/update-status", (req, res) => {

    const { id, status } = req.body;

    let orders = getOrders();

    orders = orders.map(o => {
        if (o.id == id) o.status = status;
        return o;
    });

    saveOrders(orders);

    res.json({ success: true });
});

// 🚚 تعيين سائق
app.post("/api/assign-driver", (req, res) => {

    const { id, driver } = req.body;

    let orders = getOrders();

    orders = orders.map(o => {
        if(o.id == id) o.driver = driver;
        return o;
    });

    saveOrders(orders);

    res.json({ success: true });
});

// 💬 Chat
let messages = [];

app.get("/api/chat", (req,res)=>{
    res.json(messages);
});

app.post("/api/chat", (req,res)=>{
    messages.push({
        text: req.body.text,
        date: new Date()
    });
    res.json({success:true});
});

// 📸 عرض الصور
app.use("/uploads", express.static(uploadDir));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 http://localhost:${PORT}`);
});