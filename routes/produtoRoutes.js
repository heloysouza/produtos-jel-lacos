import express from "express";
import Produto from "../models/Produto.js";

const router = express.Router();

// ✅ Rota para listar todos os produtos
router.get("/", async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ createdAt: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar produtos: " + err.message });
  }
});

// ✅ Rota para criar um novo produto
router.post("/", async (req, res) => {
  try {
    const novoProduto = new Produto(req.body);
    await novoProduto.save();
    res.status(201).json(novoProduto);
  } catch (err) {
    res.status(400).json({ erro: "Erro ao criar produto: " + err.message });
  }
});

// ✅ Rota para atualizar um produto
router.put("/:id", async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(produto);
  } catch (err) {
    res.status(400).json({ erro: "Erro ao atualizar produto: " + err.message });
  }
});

// ✅ Rota para excluir um produto
router.delete("/:id", async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json({ mensagem: "Produto removido com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao excluir produto: " + err.message });
  }
});

export default router;
