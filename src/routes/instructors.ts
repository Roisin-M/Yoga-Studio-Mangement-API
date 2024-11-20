import express, {Router} from 'express';
import {
    getInstructors,
    getInstructorById,
    createInstructor,
    deleteInstructor,
    updateInstructorPatch,
    updateInstructorPut,
} from '../controllers/instructors';
const router: Router=express.Router();

router.get('/',getInstructors);
router.get('/:id',getInstructorById);
router.post('/',createInstructor);
router.put('/:id',updateInstructorPut);
router.patch('/:id',updateInstructorPatch);
router.delete('/:id',deleteInstructor);

export default router;