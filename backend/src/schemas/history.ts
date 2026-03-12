import Joi from 'joi';

const query = Joi.object({
  contactId: Joi.string().trim().optional().label('Contact ID'),
  name: Joi.string().trim().min(2).max(150).optional().label('Name'),
})
  .xor('contactId', 'name')
  .messages({
    'object.xor': 'Provide either contactId or name, not both.',
    'object.missing': 'Provide either contactId or name.',
  });

export { query };
