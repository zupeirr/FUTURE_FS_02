import { Router } from 'express';
import { register, login, getSession, getUsers } from '../controllers/authController';

const router = Router();

router.post('/signup', register);
router.post('/signin', login);
router.get('/session', getSession);
router.get('/users', getUsers);

export default router;
