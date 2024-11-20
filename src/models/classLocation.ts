import {ObjectId} from "mongodb";
import Joi from "joi";

export enum ClassFormat{
    Location = 'Location', //classes held only at physical location
    Stream = 'Stream', // classes held only online via live stream
    Both = 'Both' // classes available both online and at the location
}

export default interface ClassLocation{
    id? :ObjectId;
    name: string;
    maxCapacity: number;
    location: string;
    classFormats: ClassFormat[];
    classIDs?:ObjectId[]; // Array of Class IDs (references to classes) for one-to many relationship
}

// create an array of valid values from Class Format enum
const classFormatsValues = Object.values(ClassFormat);

// Joi validation schema for Class Location and updates put
export const ValidateClassLocation = (classLocation: ClassLocation) => {
    const classLocationJoiSchema= Joi.object<ClassLocation>({
        name: Joi.string().min(3).required(), // Name must be at least 3 characters and required
        classFormats: Joi.array()
            .items(
                Joi.string().valid(...classFormatsValues)
            )
            .min(1)
            .required(), // Must have at least 1 class format and required
        location:Joi.string().min(5).required(), // must be at least 5 characters and required
        maxCapacity:Joi.number().min(5).required(), //max capacity must be at least 5
        classIDs: Joi.array()
        .items(
            Joi.string()
            .custom((value, helpers) => {
          if (!ObjectId.isValid(value)) {
            return helpers.error("invalid.classId", { value });
          }
          return value;
        }))
        .optional() // classIds is optional, but must contain valid ObjectId strings
    }).required();
    return classLocationJoiSchema.validate(classLocation, {abortEarly:false});
     //all joi validation errors are displayed instead of stopping and displaying just the first one
  }