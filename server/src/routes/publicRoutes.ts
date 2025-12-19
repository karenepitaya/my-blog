import { Router } from 'express';
import publicArticleRoutes from './publicArticleRoutes';

const router: Router = Router();

router.get('/', (req, res) => res.success({ route: 'publicRoutes' }));

router.use('/public/articles', publicArticleRoutes);

export default router;
