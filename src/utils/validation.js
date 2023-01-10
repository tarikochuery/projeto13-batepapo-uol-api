import Joi from "joi";

export const participantSchema = Joi.object({
  name: Joi.string()
    .required()
});