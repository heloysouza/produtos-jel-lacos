import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import Admin from "./models/Admin.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));


const corsOptions = {
  origin: ["https://produtos-jel-lacos.onrender.com"], // seu frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));


// conexão com o banco de dados
connectDB();

// Criar admin automaticamente (caso não exista)
const ensureAdmin = async () => {
  try {
    if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
      const exists = await Admin.findOne({ username: process.env.ADMIN_USER });
      if (!exists) {
        const hashed = await bcrypt.hash(process.env.ADMIN_PASS, 10);
        await Admin.create({
          username: process.env.ADMIN_USER,
          password: hashed,
        });
        console.log("✅ Admin auto-criado:", process.env.ADMIN_USER);
      }
    }
  } catch (err) {
    console.error("Erro ao garantir admin:", err.message);
  }
};
ensureAdmin();

// Rotas da API
app.use("/api/admin", adminRoutes);
app.use("/api/produtos", produtoRoutes);

// Servir o frontend (HTML, CSS, JS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Corrigido: fallback SPA (Express 5.x usa '/*' em vez de '*')
// fallback para SPA (Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
