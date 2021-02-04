'use strict';
const { get } = require('axios')

class Handler {
  constructor({ rekoService, translatorService }) {
    this.rekoService = rekoService
    this.translatorService = translatorService
  }

  async detectImageLabels(buffer) {
    const result = await this.rekoService.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()

    const workingItems = result.Labels
      .filter(({ Confidence }) => Confidence > 80)

    const names = workingItems
      .map(({ Name }) => Name)
      .join(' and ')

    return { names, workingItems }
  }

  async translateText(text) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }
    const { TranslatedText } = await this.translatorService.translateText(params).promise()

    return TranslatedText.split(' e ')
  }

  formatTextResults(texts, workingItems) {
    const finalText = []
    for(const indexText in texts) {
      const nameInPortuguese = texts[indexText]
      const confidence = workingItems[indexText].Confidence
      finalText.push(
        ` ${confidence.toFixed(2)}% de ser do tipo ${nameInPortuguese}`
      )
    }

    return finalText.join('\n')
  }
  
  async getImageBuffer(imageUrl) {
    const response = await get(imageUrl, {
      responseType: 'arraybuffer'
    })
    const buffer = Buffer.from(response.data, 'base64')

    return buffer
  }

  async main(event) {
    try {
      const { imageUrl } = event.queryStringParameters
      
      console.log('download image...')
      const buffer = await this.getImageBuffer(imageUrl)
      console.log("Detect labels...")
      const { names, workingItems } = await this.detectImageLabels(buffer)

      console.log('Translate...');
      const texts = await this.translateText(names)

      console.log('Handling final object')
      const finalText = this.formatTextResults(texts, workingItems)

      console.log('finishing')

      return {
        statusCode: 200,
        body: `A imagem tem\n`.concat(finalText)
      }
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: 'Internal Server Error'
      }
    }
  }
}

// factory
const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const translator = new aws.Translate()
const handler = new Handler({
  rekoService: reko,
  translatorService: translator
})

module.exports.main = handler.main.bind(handler);