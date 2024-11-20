import { Request, Response } from "express";
import Instructor, { ValidateInstructor } from "../models/instructor";
import { classesCollection, instructorsCollection } from "../database";
import { ObjectId } from "mongodb";
import Joi from "joi";

//get all instructors
export const getInstructors = async (req: Request, res:Response)=>{
    try {

        //allow filter searching
        const {filter}=req.query;
        const filterobj=filter?JSON.parse(filter as string):{};

        //GET allow paging
        const page = parseInt(req.query.page as string,10) || 1;
        const pageSize = parseInt(req.query.pageSize as string,0) || 0;

        // Fetch all instructors from the database
        //filtering enabled
        //project - don't include object id
        //sorting by name in ascending / alphabetical order
        const instructors = await instructorsCollection
        .find(filterobj)
        .project({'_id':0})
        .sort({'name':1})
        .skip((page-1)*pageSize)
        .limit(pageSize)
        .toArray() as Instructor[];
        res.status(200).json(instructors);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch instructors." });
    }
};

//get instructor by id and their array of classes
export const getInstructorById = async (req:Request,res:Response)=>{
    //get a single instructor by ID from database
    let id:string = req.params.id;
    try{
        const query = {_id: new ObjectId(id)};
        const instructor = (await instructorsCollection.findOne(query)) as Instructor;
        if(instructor){
            // Fetch associated classes
            const classes = await classesCollection.find({ instructorId: query}).toArray();
            res.status(200).json({instructor, classes});
        }
    } catch{
        res.status(404).send(`Unable to find matching document with id :
            ${req.params.id}`);
    }
};

// Create a new instructor
export const createInstructor = async (req: Request, res: Response) => {
    try {
        // Extract instructor data from request body
        const { name, yogaSpecialities, email } = req.body;

         // Validate the instructor data
         let validateResult: Joi.ValidationResult = ValidateInstructor(req.body);

         if (validateResult.error) {
             res.status(400).json(validateResult.error);
             return;
         }

        // Create a new instructor object with dateJoined and lastUpdated set to current date
        const newInstructor: Instructor = {
            name,
            yogaSpecialities,
            email,
        };

        // Insert the new instructor into the database
        const result = await instructorsCollection.insertOne(newInstructor);
        if (result) {
            res.status(201).location(`${result.insertedId}`).json({
                message: `Created a new instructor with id ${result.insertedId}`,
            });
        } else {
            res.status(500).send("Failed to create a new instructor.");
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue with inserting: ${error.message}`);
        } else {
            console.log(`Error with: ${error}`);
        }
        res.status(400).send("Unable to create new instructor");
    }
};

//update isntructor with PUT
export const updateInstructorPut = async (req:Request, res:Response)=>{
    let id: string=req.params.id;
    try{
        // Validate ObjectId is a valid mongoDb object
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid instructor ID format" });
            return;
        } 

         // Validate the request body with Joi
        const validateResult = ValidateInstructor(req.body);
        if (validateResult.error) {
            res.status(400).json(validateResult.error);
            return;
        }

        //create req.body as an object
        const updatedInstructor = req.body as Instructor;

        //apply update
        const result = await instructorsCollection.replaceOne(
            {_id:new ObjectId(id)},
            updatedInstructor
        );
        //error handling
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated instructor with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to instructor with id ${id}` });
        }
    }catch(error){
        console.error("Error updating instructor:", error);
        res.status(500).json({ message: "An error occurred while trying to update the instructor with PUT operation." });
    }
};

//update with PATCH - update some fields not all
export const updateInstructorPatch = async (req:Request, res:Response)=>{
    let id: string = req.params.id;
    const updates = req.body;

    try{
      // Validate ObjectId is a valid mongoDb object
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid instructor ID format" });
        return;
        }  

        //validate fields
        const allowedFields = ["name", "yogaSpecialities", "email", "classIds"];

        // Filter updates to include only allowed fields
        const filteredUpdates: Record<string, any> = {};

        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key)) {
              filteredUpdates[key] = updates[key];
            }
          }

        // If no valid fields are included, reject the update
        if (Object.keys(filteredUpdates).length === 0) {
            res.status(400).json({ message: "No valid fields provided for update." });
            return;
        }

        //update using $set operator so only specified fields are edited
        const result = await instructorsCollection.updateOne(
            {_id: new ObjectId(id)},
            {$set:filteredUpdates}
        );
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated instructor with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to instructor with id ${id}` });
        }

    }catch(error){
        console.error("Error updating instructor:", error);
        res.status(500).json({ message: "An error occurred while updating the instructor" });
    }
};

export const deleteInstructor =async (req:Request,res:Response)=>{

    let id:string=req.params.id;
    try{
        const query ={_id: new ObjectId(id)};
        const result = await instructorsCollection.deleteOne(query);

        if(result && result.deletedCount){
            res.status(202).json({message : `succesfully removed instructor with id 
                ${id}`});
        }else if(!result){
            res.status(400).json({message: `failed to remove instructor with id
                ${id}`});
        }else if(!result.deletedCount){
            res.status(404).json({message : `no instructor found with id
                ${id}`});
        }
    }catch (error){
        console.error(error);
        res.status(400).send(error);
    }
};