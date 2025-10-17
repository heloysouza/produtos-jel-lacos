import Produto from "../models/Produto.js";

export const listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ createdAt: -1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const criarProduto = async (req, res) => {
  try {
    const novoProduto = await Produto.create(req.body);
    res.status(201).json(novoProduto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const atualizarProduto = async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletarProduto = async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.json({ message: "Produto removido" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
