import mongoose from "mongoose";

const produtoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // lista de URLs de imagens
      default: [],
    },
  },
  {
    timestamps: true, // cria campos createdAt e updatedAt
  }
);

const Produto = mongoose.model("Produto", produtoSchema);

export default Produto;
