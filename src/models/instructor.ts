import {ObjectId} from "mongodb";
import Joi from "joi";

// Define YogaSpeciality as an Enum
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

export default interface Instructor{
    name: string;
    yogaSpecialities :YogaSpeciality[];
    email:string;
    id?: ObjectId;
    classIds?: ObjectId[]; // Array of Class IDs (references to classes) for one-to many relationship
}

// create an array of valid values from YogaSpeciality enum
const yogaSpecialityValues = Object.values(YogaSpeciality);

// Joi validation schema for Instructor and put updates
export const ValidateInstructor = (instructor: Instructor) => {
  const instructorJoiSchema = Joi.object<Instructor>({
    name: Joi.string().min(3).required(), // Name must be at least 3 characters and required
    yogaSpecialities: Joi.array()
      .items(
          Joi.string().valid(...yogaSpecialityValues))
      .min(1)
      .required(), // Must have at least 1 valid yoga speciality and required
    email: Joi.string().email().required(), // Email must be valid and required
    classIds: Joi.array()
      .items(
          Joi.string()
          .custom((value, helpers) => {
        if (!ObjectId.isValid(value)) {
          return helpers.error("invalid.classId", { value });
        }
        return value;
      }))
      .optional() // classIds is optional, but must contain valid ObjectId strings
  }).required(); // The entire object must be provided for a complete update

  return instructorJoiSchema.validate(instructor, { abortEarly: false });
  //all joi validation errors are displayed instead of stopping and displaying just the first one
};
  