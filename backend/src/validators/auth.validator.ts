import Joi from 'joi'

export const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  password: Joi.string().required().min(6),
  captchaCode: Joi.string().optional(),
  captchaToken: Joi.string().optional(),
})

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
})