import { Router } from 'express';
import publicArticleRoutes from './publicArticleRoutes';
import publicCategoryRoutes from './publicCategoryRoutes';
import publicTagRoutes from './publicTagRoutes';
import publicAuthorRoutes from './publicAuthorRoutes';

const router: Router = Router();

router.get('/', (req, res) => res.success({ route: 'publicRoutes' }));

router.use('/public/articles', publicArticleRoutes);
router.use('/public/categories', publicCategoryRoutes);
router.use('/public/tags', publicTagRoutes);
router.use('/public/authors', publicAuthorRoutes);

export default router;
