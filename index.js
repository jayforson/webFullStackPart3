require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const Person = require('./module/person')

app.use(express.static('build'))
app.use(express.json())

morgan.token('body', function (req, res) {
    return req.method === 'POST' ? JSON.stringify(req.body) : ""
})

app.use(morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
      tokens.body(req, res)
    ].join(' ')
  }))

app.get('/info', (request, response) => {
    title = "<h1>phone Book</h1>"
    info = "<div>phonebook has info for " + Person.length + " people</div>"
    date = "<p>" + new Date() + "</p>"

    response.send(title + info + date)
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
   
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    newPerson = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, newPerson, { new : true})
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    const person = new Person({
        name: body.name,
        number: body.number
    })
            
    person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
  
    next(error)
  }
  
// this has to be the last loaded middleware.
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT)
console.log(`Server running on port ${PORT}`)