const express = require('express')
const path = require('path')
const initials = require('./lib/initials')
const generateFontSize = require('./lib/generateFontSize')
const idToColor = require('./lib/idToColor')
const { validateHex } = require('./lib/colors')
const errorHandlingMiddleware = require('./middlewares/errorHandling')
const ejs = require('ejs')
const sharp = require('sharp')

const port = process.env.PORT
const app = express()

function getColor (req) {
  if (req.query.c) {
    if (validateHex(req.query.c)) {
      return `#${req.query.c}`
    }
    const error = new Error('Invalid color parameter')
    error.code = 'invalid_color'
    error.status = 422
    throw error
  }

  return idToColor(req.params.id)
}

app.get('/avatar/:id(\\w+)/:initials.:format(png|svg)?', async (req, res) => {
  const color = getColor(req)
  const text = initials(req.params.initials)
  const imageSize = parseInt(req.query.s, 10) || 100
  const fontSize = generateFontSize(imageSize)
  console.log(fontSize)
  const format = req.params.format

  if (format === 'png') {
    const html = await ejs.renderFile(path.join(__dirname, 'views/svg.ejs'), { color, text, imageSize, fontSize, dy: '.25em' })
    res.set('Content-Type', 'image/png')
    const svg = Buffer.from(html)
    sharp(svg, { density: 450 })
      .resize({ width: imageSize })
      .png()
      .pipe(res)
  } else {
    const html = await ejs.renderFile(path.join(__dirname, 'views/svg.ejs'), { color, text, imageSize, fontSize, dy: 0 })
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('vary', 'Accept-Encoding')
    res.send(html)
  }
})

app.get('/', (req, res) => {
  res.json({ status: 'okay' })
})

app.use(errorHandlingMiddleware)
console.log(`Listening: http://localhost:${port}`)
app.listen(port)

module.exports = app
