import { Request, Response } from "express";
import Class, {ValidateClass} from "../models/class";
import { classesCollection, classLocationsCollection, instructorsCollection } from "../database";
import { ObjectId } from "mongodb";
import Joi from "joi";

// Get all classes
export const getClasses = async (req: Request, res: Response) => {
    try {
        // Allow filtering
        const { filter } = req.query;
        const filterObj = filter ? JSON.parse(filter as string) : {};

         // Convert string IDs to ObjectId if necessary
         if (filterObj.instructorId) {
            filterObj.instructorId = new ObjectId(filterObj.instructorId);
        }
        if (filterObj.classLocationId) {
            filterObj.classLocationId = new ObjectId(filterObj.classLocationId);
        }

        // Handle date filtering
        if (filterObj.date) {
            if (filterObj.date.$gte) filterObj.date.$gte = new Date(filterObj.date.$gte);
            if (filterObj.date.$lte) filterObj.date.$lte = new Date(filterObj.date.$lte);
        }

        // Allow pagination
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 0) || 0;

        // Fetch all classes from the database
        const classes = await classesCollection
            .find(filterObj)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray() as Class[];
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ message: "Unable to fetch classes." });
    }
};

// Get a class by ID
export const getClassById = async (req: Request, res: Response) => {
    let id: string = req.params.id;
    try {
        const query = { _id: new ObjectId(id) };
        const classItem = (await classesCollection.findOne(query)) as Class;
        if (classItem) {
            res.status(200).send(classItem);
        } else {
            res.status(404).send(`Class not found with id: ${req.params.id}`);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
};

// Create a new class
export const createClass = async (req: Request, res: Response) => {
    try {
        const { instructorId, description, classLocationId, date, startTime, endTime, level, type, category, classFormat, spacesAvailable 

        } = req.body;

        // Validate the class data
        let validateResult: Joi.ValidationResult = ValidateClass(req.body);

        if (validateResult.error) {
            res.status(400).json(validateResult.error);
            return;
        }

        // check that instructorID exists in instructor model
        const instructorExists = await instructorsCollection.findOne({ _id: new ObjectId(instructorId) });
        if (!instructorExists) {
            res.status(404).json({message: `No instructor found with instructor id ${instructorId}`});
            return;
        }

        // check that classLocationID exists in classLocation model
        const classLocationExists = await classLocationsCollection.findOne({ _id: new ObjectId(classLocationId) });
        if (!classLocationExists) {
            res.status(404).json({message: `No class Location found with class Location id ${instructorId}`});
            return;
        }

        // Create a new class object
        const newClass: Class = {
            instructorId: new ObjectId(instructorId), //convert string to ObjectID
            description,
            classLocationId: new ObjectId(classLocationId), //convert string to OBjectID 
            date:new Date(date), // Convert string to Date
            startTime,
            endTime,
            level,   // Class levels like Beginner, Intermediate
            type,    // Yoga specialities like Hatha, Vinyasa
            category, // Class categories like Balance, Strength
            classFormat, // Class format like Location, Stream, Both
            spacesAvailable // number of available spaces
        };

        // Insert the new class into the database
        const result = await classesCollection.insertOne(newClass);
        if (result.insertedId) {
            //link the new class to the instructor
            await instructorsCollection.updateOne(
                {_id: new ObjectId(instructorId)},
                {$push: {classIds: result.insertedId}}
            );
            //link the new class to the class Location
            await classLocationsCollection.updateOne(
                {_id: new ObjectId(classLocationId)},
                {$push: {classIDs: result.insertedId}}
            )
            res.status(201).location(`${result.insertedId}`).json({
                message: `Created a new class with id ${result.insertedId}`,
            });
        } else {
            res.status(500).send("Failed to create a new class.");
        }
    } catch (error) {
        res.status(400).send("Unable to create new class");
    }
};

export const updateClassPut = async(req:Request, res:Response)=>{
    let id: string=req.params.id;
    try{
        // Validate ObjectId is a valid mongoDb object
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid class ID format" });
            return;
        }

        //joi validation
        let validateResult: Joi.ValidationResult = ValidateClass(req.body);

        if (validateResult.error) {
            res.status(400).json(validateResult.error);
            return;
        }

        const updatedClass = req.body as Class;

        //apply update
        const result = await classesCollection.replaceOne(
            {_id: new ObjectId(id)},
            updatedClass
        );
        //error handling
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated class with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to class with id ${id}` });
        }
    }catch(error){
        console.error("Error updating class:", error);
        res.status(500).json({ message: "An error occurred while trying to update the class with PUT operation." });
    }
};

//update PATCH
export const updateClassPatch = async (req: Request, res: Response)=>{
    let id: string = req.params.id;
    const updates = req.body;
    try {
        // Validate ObjectId is a valid mongoDb object
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid class ID format" });
            return;
        }

        //update using $set operator so only specified fields are edited
        const result = await classesCollection.updateOne(
            {_id: new ObjectId(id)},
            {$set: updates}
        );
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated class with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to class with id ${id}` });
        }
    }catch(error){
        console.error("Error updating class:", error);
        res.status(500).json({ message: "An error occurred while updating the class" });
    }
};

// Delete a class by ID
export const deleteClass = async (req: Request, res: Response) => {
    let id: string = req.params.id;
    try {
        const query = { _id: new ObjectId(id) };
        const result = await classesCollection.findOne(query);

        if(!result){
            res.status(404).json({ message: `No class found with id ${id}` });
        }

        const deleteResult=await classesCollection.deleteOne(query);

        if (deleteResult.deletedCount) {
            //remove class reference from the instructor
            await instructorsCollection.updateOne(
                {_id: new ObjectId(result?.instructorId)},
                {$pull:{classIds:new ObjectId(id)}}
            );
            //remove class reference from the class Location
            await classLocationsCollection.updateOne(
                {_id: new ObjectId(result?.classLocationId)},
                {$pull:{classIds:new ObjectId(id)}}
            );
            res.status(202).json({ message: `Successfully removed class with id ${id}` });
        } else{
            res.status(400).json({ message: `Failed to remove class with id ${id}` });
        }
    } catch (error) {
        res.status(500).json({message:"Error deleting class", error});
    }
};

