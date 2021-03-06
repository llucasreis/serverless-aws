const uuid = require('uuid')
const Joi = require('@hapi/joi')
const decoratorValidator = require('./utils/decoratorValidator')
const globalEnum = require('./utils/globalEnum')

class Handler {
  constructor({ dynamoDBService }) {
    this.dynamoDBService = dynamoDBService
    this.dynamoDBTable = process.env.DYNAMODB_TABLE
  }
  
  static validator() {
    return Joi.object({
      nome: Joi.string().max(100).min(2).required(),
      poder: Joi.string().max(20).required()
    })
  }

  async insertItem(params) {
    return this.dynamoDBService.put(params).promise()
  }

  prepareData(data) {
    const params = {
      TableName: this.dynamoDBTable,
      Item: {
        ...data,
        id: uuid.v4(),
        createdAt: new Date().toISOString()
      }
    }

    return params
  }

  handlerSuccess(data) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    }
    return response
  }

  handlerError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: {'Content-Type': 'text/plain'},
      body: 'Internal Server Error!'
    }
  }

  async main(event) {
    try {
      const data = event.body
      
      const dbParams = this.prepareData(data)
      await this.insertItem(dbParams)
      return this.handlerSuccess(dbParams.Item)
    } catch (error) {
      console.error('Error: ', error)

      return this.handlerError({ statusCode: 500 })
    }
  }
}

const aws = require('aws-sdk')
const dynamoDB = new aws.DynamoDB.DocumentClient()
const handler = new Handler({
  dynamoDBService: dynamoDB
})
module.exports = decoratorValidator(
  handler.main.bind(handler),
  Handler.validator(),
  globalEnum.ARG_TYPE.BODY
)