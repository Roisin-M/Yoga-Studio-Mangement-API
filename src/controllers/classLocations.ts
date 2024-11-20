import { Request, response, Response } from "express";
import ClassLocation, { ValidateClassLocation} from "../models/classLocation";
import { classesCollection, classLocationsCollection, instructorsCollection } from "../database";
import { ObjectId } from "mongodb";
import Joi from "joi";

//get all class locations
export const getClassLocations = async (req: Request, res:Response)=>{
    try {

        //allow filter searching
        const {filter}=req.query;
        const filterobj=filter?JSON.parse(filter as string):{};

        //GET allow paging
        const page = parseInt(req.query.page as string,10) || 1;
        const pageSize = parseInt(req.query.pageSize as string,0) || 0;

        // Fetch all class locations from the database
        //filtering enabled
        //project - don't include object id
        //sorting by name in ascending / alphabetical order
        const classLocations = await classLocationsCollection
        .find(filterobj)
        .project({'_id':0})
        .sort({'name':1})
        .skip((page-1)*pageSize)
        .limit(pageSize)
        .toArray() as ClassLocation[];
        res.status(200).json(classLocations);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch class locations." });
    }
};
//get class location by id and its associated array of class ids
export const getClassLocationsById = async (req:Request,res:Response)=>{
    //get a single class Location by ID from database
    let id:string = req.params.id;
    try{
        const query = {_id: new ObjectId(id)};
        const classLocation = (await classLocationsCollection.findOne(query)) as ClassLocation;
        if(classLocation){
            //fetch associated classes
            const classes = await classesCollection.find({classLocationId: query}).toArray();
            res.status(200).json({classLocation, classes});
        }
    } catch{
        res.status(404).send(`Unable to find matching document with id :
            ${req.params.id}`);
    }
};

// Create a new class location
export const createClassLocation = async (req: Request, res: Response) => {
    try {
        // Extract class Location data from request body
        const { name, maxCapacity, location, classFormats  } = req.body;

        // Create a new class Location object 
        const newClassLocation: ClassLocation = {
            name,
            maxCapacity,
            location,
            classFormats,
        };

        // Validate the instructor data
        let validateResult: Joi.ValidationResult = ValidateClassLocation(req.body);

        if (validateResult.error) {
            res.status(400).json(validateResult.error);
            return;
        }

        // Insert the new class Location into the database
        const result = await classLocationsCollection.insertOne(newClassLocation);
        if (result) {
            res.status(201).location(`${result.insertedId}`).json({
                message: `Created a new class location with id ${result.insertedId}`,
            });
        } else {
            res.status(500).send("Failed to create a new class location.");
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue with inserting: ${error.message}`);
        } else {
            console.log(`Error with: ${error}`);
        }
        res.status(400).send("Unable to create new class location");
    }
};

// Update a class location with Put
export const updateClassLocationPut = async (req: Request, res: Response) => {
    let id: string = req.params.id;
   try{
        // Validate ObjectId is a valid mongoDb object
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid class Location ID format" });
            return;
        } 

        //validate the request with joi
        const validateResult = ValidateClassLocation(req.body);
        if (validateResult.error) {
            res.status(400).json(validateResult.error);
            return;
        }

        //create req.body as an object
        const updatedClasLocation = req.body as ClassLocation;

        const result=await classLocationsCollection.replaceOne(
            {_id:new ObjectId(id)},
            updatedClasLocation
        );

         //error handling
         if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated class location with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to class location with id ${id}` });
        }


   }catch(error){
    console.error("Error updating class location:", error);
    res.status(500).json({ message: "An error occurred while trying to update the class location with PUT operation." });
   }
};

//u[date with PATCH - update some fields not all
export const updateClassLocationPatch = async (req:Request, res:Response)=>{
    let id: string = req.params.id;
    const updates = req.body;
    try{
        // Validate ObjectId is a valid mongoDb object
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid class Location ID format" });
        return;
        } 
        //validate fields
        const allowedFields =["name","maxCapacity","location","classFormats","classIDs"]; 

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
        
        //update using set operator so only specified fields are edited
        const result = await classLocationsCollection.updateOne(
            {_id:new ObjectId(id)},
            {$set:filteredUpdates}
        );
        //error handling
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: `Successfully updated class Location with id ${id}` });
        } else {
            res.status(200).json({ message: `No changes made to class Location with id ${id}` });
        }
    }catch(error){
        console.error("Error updating class location:", error);
        res.status(500).json({ message: "An error occurred while updating the class location" });
    }
};

//delete class location by id
export const deleteClassLocation =async (req:Request,res:Response)=>{

    let id:string=req.params.id;
    try{
        const query ={_id: new ObjectId(id)};
        const result = await classLocationsCollection.deleteOne(query);

        if(result && result.deletedCount){
            res.status(202).json({message : `succesfully removed class location with id 
                ${id}`});
        }else if(!result){
            res.status(400).json({message: `failed to remove class location with id
                ${id}`});
        }else if(!result.deletedCount){
            res.status(404).json({message : `no class location found with id
                ${id}`});
        }
    }catch (error){
        console.error(error);
        res.status(400).send(error);
    }
};