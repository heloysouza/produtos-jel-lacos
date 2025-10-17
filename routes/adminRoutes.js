import express from "express";
import { criarAdmin, loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/register", criarAdmin); // use apenas uma vez para criar o admin
router.post("/login", loginAdmin);

export default router;
