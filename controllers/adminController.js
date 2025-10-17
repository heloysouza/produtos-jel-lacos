import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Criar admin inicial (opcional)
export const criarAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existente = await Admin.findOne({ username });
    if (existente) return res.status(400).json({ message: "Admin já existe" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const novoAdmin = await Admin.create({ username, password: hash });
    res.status(201).json({ message: "Administrador criado", admin: novoAdmin.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login do admin
export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(password, admin.password);
    if (!senhaValida) return res.status(400).json({ message: "Senha incorreta" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
