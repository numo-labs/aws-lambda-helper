module.exports = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['param1', 'param2', 'param3', 'param4'],
            properties: {
              param1: {
                type: 'string'
              },
              param2: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                uniqueItems: true
              },
              param3: {
                enum: ['standard']
              },
              param4: {
                type: 'integer',
                minimum: 1
              }
            }
          }
        }
      },
      required: ['docs']
    }
  },
  required: ['body']
};
