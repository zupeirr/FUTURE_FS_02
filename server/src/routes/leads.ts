import { Router } from 'express';
import { 
  getLeads, 
  getLead, 
  createLead, 
  updateLead, 
  deleteLead,
  bulkDeleteLeads,
  bulkUpdateStatus,
  getStats
} from '../controllers/leadController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Secure all lead routes

router.get('/stats', getStats);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/bulk-delete', bulkDeleteLeads);
router.post('/bulk-update-status', bulkUpdateStatus);

export default router;
