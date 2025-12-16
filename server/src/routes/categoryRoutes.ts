import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';

const router: ExpressRouter = Router();
const categoryController = new CategoryController();

// 所有分类路由都需要认证和管理员权限
router.use(authMiddleware);
router.use(requireRole(['admin']));

const categoryIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, '无效的分类ID'),
});

const descriptionSchema = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.union([z.string().trim().max(200, '分类描述不能超过200个字符'), z.null()]).optional()
);

const createCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1, '分类名称是必需的').max(50, '分类名称不能超过50个字符'),
    slug: z.string().trim().min(1).max(100).optional(),
    description: descriptionSchema,
  })
  .strict();

const updateCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符').optional(),
    slug: z.string().trim().min(1).max(100).optional(),
    description: descriptionSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny = data.name !== undefined || data.slug !== undefined || data.description !== undefined;
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '没有提供更新内容',
      });
    }
  });

// 路由定义
/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *           example: 前端开发
 *         slug:
 *           type: string
 *           description: 分类标识
 *           example: frontend
 *         description:
 *           type: string
 *           description: 分类描述
 *           example: 前端技术相关文章
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: 获取所有分类
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   get:
 *     summary: 根据 ID 获取分类
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 成功获取分类
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 分类不存在
 */
router.get('/:id', validateRequest({ params: categoryIdSchema }), categoryController.getCategoryById);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: 创建分类
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *                 example: 前端开发
 *               slug:
 *                 type: string
 *                 description: 分类标识（可选，会自动生成）
 *                 example: frontend
 *               description:
 *                 type: string
 *                 description: 分类描述
 *                 example: 前端技术相关文章
 *     responses:
 *       201:
 *         description: 成功创建分类
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       409:
 *         description: 分类名称已存在
 */
router.post('/', validateRequest({ body: createCategoryBodySchema }), categoryController.createCategory);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: 更新分类
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *                 example: 前端技术
 *               slug:
 *                 type: string
 *                 description: 分类标识
 *                 example: frontend-tech
 *               description:
 *                 type: string
 *                 description: 分类描述
 *                 example: 前端技术相关的文章
 *     responses:
 *       200:
 *         description: 成功更新分类
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 分类不存在
 *       409:
 *         description: 分类名称或标识已存在
 */
router.put(
  '/:id',
  validateRequest({ params: categoryIdSchema, body: updateCategoryBodySchema }),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: 删除分类
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 成功删除分类
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 分类不存在
 */
router.delete('/:id', validateRequest({ params: categoryIdSchema }), categoryController.deleteCategory);

export default router;
