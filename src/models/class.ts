import { ObjectId } from "mongodb";
import Joi from "joi";

// Enum for Yoga Speciality
export enum YogaSpeciality {
    Hatha = 'Hatha',
    Vinyasa = 'Vinyasa',
    Ashtanga = 'Ashtanga',
    Bikram = 'Bikram',
    Iyengar = 'Iyengar',
    Kundalini = 'Kundalini',
    Yin = 'Yin',
    Restorative = 'Restorative',
    PowerYoga = 'Power Yoga',
    Jivamukti = 'Jivamukti',
    Anusara = 'Anusara',
    Sivananda = 'Sivananda',
    Prenatal = 'Prenatal',
    AerialYoga = 'Aerial Yoga',
    AcroYoga = 'AcroYoga',
    ChairYoga = 'Chair Yoga',
    Viniyoga = 'Viniyoga',
    YogaNidra = 'Yoga Nidra',
    IntegralYoga = 'Integral Yoga',
    TantraYoga = 'Tantra Yoga'
}

// Enum for Class Levels
export enum ClassLevel {
    Beginner = 'Beginner',
    Intermediate = 'Intermediate',
    Advanced = 'Advanced'
}

// Enum for Class Categories (focuses)
export enum ClassCategory {
    Balance = 'Balance',
    Flexibility = 'Flexibility',
    Strength = 'Strength',
    Handstands = 'Handstands',
    UpsideDown = 'Upside Down',
    Relaxation = 'Relaxation',
    Core = 'Core',
}

// Enum for Class Format
export enum ClassFormat {
    Location = 'Location', // classes held only at physical location
    Stream = 'Stream', // classes held only online via live stream
    Both = 'Both' // classes available both online and at the location
}

// Interface for Class Model
export default interface Class {
    id?: ObjectId;
    instructorId: ObjectId; // Reference to the Instructor for one-to many relationship
    description: string;
    classLocationId: ObjectId; // Reference to the Class Location for one-to many relationship
    date: Date; //type date (day only)
    startTime: string; //hh:mm string in 24 hour format
    endTime: string;  //hh:mm string in 24 hour format
    level: ClassLevel[]; // Array of class levels (e.g., Beginner, Intermediate, Advanced)
    type: YogaSpeciality[]; // Array of yoga specialities (reusing YogaSpeciality enum)
    category: ClassCategory[]; // Array of class categories (focus of the class)
    classFormat: ClassFormat; // Format of the class (Location, Stream, or Both)
    spacesAvailable: number; // Number of available spaces for the class
}

// Create arrays of valid values from enums
const classLevelValues = Object.values(ClassLevel);
const classCategoryValues = Object.values(ClassCategory);
const classFormatValues = Object.values(ClassFormat);
const yogaSpecialityValues = Object.values(YogaSpeciality);

//const datePattern = /^(0[1-9]|[12][0-9]|3[01])(\/|-)(0[1-9]|1[0-2])(\/|-)(19|20)\d{2}$/;
const timePattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/

// Joi validation schema for Class and for puts
export const ValidateClass = (classObj: Class) => {
    const classJoiSchema = Joi.object<Class>({
        instructorId: Joi.string().custom((value, helpers) => {
            if (!ObjectId.isValid(value)) {//checks if the value is a valid MongoDB ObjectId
                return helpers.error("invalid instructor ID", { value });//custom error message
            }
            return value;
        }).required(), // Instructor ID is required
        description: Joi.string().min(10).required(), // Description must be at least 10 characters and required
        classLocationId: Joi.string().custom((value, helpers) => {
            if (!ObjectId.isValid(value)) {//checks if the value is a valid MongoDB ObjectId
                return helpers.error("invalid class Loaction ID", { value });
            }
            return value;
        }).required(), // Class Location ID is required
        date: Joi.date().iso().required(), //validate date type as date and iso
        startTime: Joi.string().pattern(timePattern).required(), // Start Time in 24-hour format HH:mm
        endTime: Joi.string()
        .pattern(timePattern)
            .required()
            .custom((value, helpers) => {
                const startTime = helpers.state.ancestors[0].startTime;
                if (startTime && startTime >= value) {
                    return helpers.error("any.invalid", {
                        startTime,
                        endTime: value,
                    });
                }
                return value;
            })
            .messages({
                "string.pattern.base": "End time must be in HH:mm 24-hour format",
                "any.invalid": "End time must be after start time",
            }), // End Time in 24-hour format HH:mm, required and greater than startTime
        level: Joi.array()
            .items(Joi.string().valid(...classLevelValues))
            .min(1)
            .required(), // Must have at least one valid class level
        type: Joi.array()
            .items(Joi.string().valid(...yogaSpecialityValues))
            .min(1)
            .required(), // Must have at least one valid yoga speciality
        category: Joi.array()
            .items(Joi.string().valid(...classCategoryValues))
            .min(1)
            .required(), // Must have at least one valid class category
        classFormat: Joi.string().valid(...classFormatValues).required(), // Class Format is required and must be a valid format
        spacesAvailable: Joi.number().integer().min(0).required() // Spaces available must be a non-negative integer and required
    }).required();

    return classJoiSchema.validate(classObj, {abortEarly:false});
};
