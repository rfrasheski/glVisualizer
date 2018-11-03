const express = require('express')
const router = express.Router()
const request = require('request')
const config = require('../config')

router.get('/', function(req, res, next) {
  const refresh_token = req.query.token

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(config.client_id + ':' + config.client_secret).toString('base64')) },
    form: {
      refresh_token,
      grant_type: 'refresh_token'
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token
      res.send({ access_token })
    }
  })
})

module.exports = router