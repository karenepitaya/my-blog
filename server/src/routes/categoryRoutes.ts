import { Router } from "express";
import {
  createCategory,
  listCategories,
  deleteCategory,
} from "../controllers/categoryController";

const router = Router();

router.post("/create", createCategory);
router.get("/list", listCategories);
router.delete("/:id", deleteCategory);

export default router;

