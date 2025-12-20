import { Router } from 'express';
import publicArticleRoutes from './publicArticleRoutes';
import publicCategoryRoutes from './publicCategoryRoutes';
import publicTagRoutes from './publicTagRoutes';

const router: Router = Router();

router.get('/', (req, res) => res.success({ route: 'publicRoutes' }));

router.use('/public/articles', publicArticleRoutes);
router.use('/public/categories', publicCategoryRoutes);
router.use('/public/tags', publicTagRoutes);

export default router;
