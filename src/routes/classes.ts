import express, {Router} from 'express';
import { 
    getClasses,
    getClassById,
    createClass,
    updateClassPut,
    deleteClass,
    updateClassPatch
 } from '../controllers/classes';
 const router: Router=express.Router();

router.get('/',getClasses);
router.get('/:id',getClassById);
router.post('/',createClass);
router.put('/:id',updateClassPut);
router.patch('/:id', updateClassPatch);
router.delete('/:id',deleteClass);

export default router;