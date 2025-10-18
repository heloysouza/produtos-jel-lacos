import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import Admin from "./models/Admin.js";

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// Middleware básico
app.use(express.json({ limit: "12mb" }));

// -----------------------------
// 🟢 CORS — configuração simples
// -----------------------------
// Como o frontend está dentro do backend (mesmo domínio),
// basta permitir qualquer origem durante desenvolvimento.
// No Render, o mesmo domínio acessa o backend, então não há conflito.
const corsOptions = {
  origin: [
    "http://localhost:5000",           // para rodar localmente
    "http://localhost:5173",           // se usar Vite
    "https://produtos-jel-lacos.onrender.com" // domínio de produção
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors(corsOptions));

// -----------------------------
// 🟢 Conexão com banco de dados
// -----------------------------
connectDB();

// -----------------------------
// 🟢 Garante que o admin exista
// -----------------------------
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
        console.log("✅ Admin criado automaticamente:", process.env.ADMIN_USER);
      } else {
        console.log("👤 Admin já existe:", exists.username);
      }
    } else {
      console.warn("⚠️ Variáveis ADMIN_USER e ADMIN_PASS não definidas.");
    }
  } catch (err) {
    console.error("❌ Erro ao garantir admin:", err.message);
  }
};
ensureAdmin();

// -----------------------------
// 🟢 Rotas da API
// -----------------------------
app.use("/api/admin", adminRoutes);
app.use("/api/produtos", produtoRoutes);

// -----------------------------
// 🟢 Servir o frontend (React ou HTML)
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve tudo dentro da pasta "public"
app.use(express.static(path.join(__dirname, "public")));

// Fallback para SPA (React, HTML5 History API, etc)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -----------------------------
// 🟢 Iniciar servidor
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
