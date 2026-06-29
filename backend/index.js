import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from './routes/authRoutes.js'
import complaintRoutes from './routes/complaintRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

let PORT = 3000;
app.get('/',(req,res)=>{
    res.status(200).json({message:"HostelResolve Backend Running!"});
})

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(PORT,()=>{
    console.log(`Server running on PORT ${PORT}`);
})