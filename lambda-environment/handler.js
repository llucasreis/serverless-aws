'use strict';
const settings = require('./config/settings')
const axios = require('axios')
const cheerio = require('cheerio')
const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const uuid = require('uuid')

class Handler {
  static async main(event) {
    console.log('at', new Date().toISOString(), JSON.stringify(event, null, 2))
    const { data } = await axios.get(settings.commitMessageUrl)
    const $ = cheerio.load(data)
    const [commitMessage] = await $("#content").text().trim().split('\n')
    console.log('Message', commitMessage)

    const params = {
      TableName: settings.DBTableName,
      Item: {
        commitMessage,
        id: uuid.v4(),
        createdAt: new Date().toISOString()
      }
    }
    await dynamoDB.put(params).promise()

    console.log("Process Finished at", new Date().toISOString())
    
    return {
      statusCode: 200
    }
  }
}

module.exports = {
  scheduler: Handler.main
}