import Joi from "joi";

export const participantSchema = Joi.object({
  name: Joi.string()
    .required()
});

export const messageSchema = Joi.object({
  to: Joi.string()
    .required(),
  text: Joi.string()
    .required(),
  type: Joi.string()
    .valid('message', 'private_message')
    .required()
});

export const getMessagesSchema = Joi.number().positive();