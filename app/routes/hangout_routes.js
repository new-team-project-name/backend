// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for hangouts
const Hangout = require('../models/hangout')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { hangout: { title: '', text: 'foo' } } -> { hangout: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /hangouts
router.get('/hangouts', requireToken, (req, res, next) => {
  Hangout.find()
    .then(hangouts => {
      // `hangouts` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return hangouts.map(hangout => hangout.toObject())
    })
    // respond with status 200 and JSON of the hangouts
    .then(hangouts => res.status(200).json({ hangouts: hangouts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /hangouts/5a7db6c74d55bc51bdf39793
router.get('/hangouts/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Hangout.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "hangout" JSON
    .then(hangout => res.status(200).json({ hangout: hangout.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /hangouts
router.post('/hangouts', requireToken, (req, res, next) => {
  // set owner of new hangout to be current user
  req.body.hangout.owner = req.user.id

  Hangout.create(req.body.hangout)
    // respond to succesful `create` with status 201 and JSON of new "hangout"
    .then(data => Hangout.find())
    .then(hangouts => {
      // `hangouts` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return hangouts.map(hangout => hangout.toObject())
    })
    // respond with status 200 and JSON of the hangouts
    .then(hangouts => res.status(200).json({ hangouts: hangouts }))
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /hangouts/5a7db6c74d55bc51bdf39793
router.patch('/hangouts/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prhangout that by deleting that key/value pair
  delete req.body.hangout.owner

  Hangout.findById(req.params.id)
    .then(handle404)
    .then(hangout => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, hangout)

      // pass the result of Mongoose's `.update` to the next `.then`
      return hangout.updateOne(req.body.hangout)
    })
    // if that succeeded, return 204 and no JSON
    .then(data => Hangout.find())
    .then(hangouts => {
      // `hangouts` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return hangouts.map(hangout => hangout.toObject())
    })
    // respond with status 200 and JSON of the hangouts
    .then(hangouts => res.status(200).json({ hangouts: hangouts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /hangouts/5a7db6c74d55bc51bdf39793
router.delete('/hangouts/:id', requireToken, (req, res, next) => {
  Hangout.findById(req.params.id)
    .then(handle404)
    .then(hangout => {
      // throw an error if current user doesn't own `hangout`
      requireOwnership(req, hangout)
      // delete the hangout ONLY IF the above didn't throw
      hangout.deleteOne()
    })
    .then(data => Hangout.find())
    .then(hangouts => {
      // `hangouts` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return hangouts.map(hangout => hangout.toObject())
    })
    .then(hangouts => res.status(200).json({ hangouts: hangouts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
