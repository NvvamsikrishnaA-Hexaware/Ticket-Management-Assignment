const Joi = require('@hapi/joi')
const schemas = {
    createUser: Joi.object().keys({
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        password: Joi.string().required()
    }),
    createTicket: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().required()
    }),
    loginSchema: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required()
    })
};
module.exports = schemas;