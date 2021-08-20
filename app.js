require('dotenv').config()

const express = require('express')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const schemas = require('./schemas')
const middleware = require('./middleware')
const passport = require('passport')
const { session } = require('passport')
const passportAuth = require('./passport-auth')(passport)
//const passport = require('passport')

// var JwtStrategy = require('passport-jwt').Strategy,
//     ExtractJwt = require('passport-jwt').ExtractJwt;
// var opts = {}
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = process.env.ACCESS_TOKEN_SECRET;
// passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
//     User.findOne({id: jwt_payload.sub}, function(err, user) {
//         if (err) {
//             return done(err, false);
//         }
//         if (user) {
//             return done(null, user);
//         } else {
//             return done(null, false);
//             // or you could create a new account
//         }
//     });
// }));

const app = express()
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())


// function authenticateToken(request, response, next) {
//     const authHeader = request.headers['authorization']
//     const token = authHeader && authHeader.split(' ')[1]
//     if (token == null) return response.sendStatus(401)

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//         if (err) return response.sendStatus(403)
//         request.user = user
//         next()
//     })
// }

function sortData(argData){
    return argData.slice().sort(function(a, b) {
        var nameA = a.createdAt.toUpperCase();
        var nameB = b.createdAt.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
}

app.get('/users', (req, res) => {
    try {
        const users = require('./users.json')
        res.status(200).json(users)
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.post('/user', middleware(schemas.createUser), (req, res) => {
    try {
        var data = require('./users.json')
        var dataObj = data
        if (data.some(user => user.email === req.body.email)) {
            res.status(409).send("User already exists")
        }
        else {

            let newUser = {
                id: dataObj.length + 1,
                email: req.body.email,
                name: req.body.name,
                password: req.body.password,
                role: 'user'
            }

            dataObj.push(newUser)

            var updatedData = JSON.stringify(dataObj)
            fs.writeFile("users.json", updatedData, (err) => {
                if (err) throw err
                console.log("Data updated")
                res.status(201).send("User Registeration Successfull")
            })
        }
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.post('/user/login', middleware(schemas.loginSchema), (req, res) => {
        try {
            const data = require('./users.json')
            if (data.some(user => user.email === req.body.email && user.password === req.body.password)) {
                const user = data.find(user => user.email === req.body.email)
                const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
                res.status(200).json({ accessToken: accessToken })
            }
            else {
                res.status(401).send("Invalid Credentials")
            }
        }
        catch {
            res.status(503).send('Service Unavailable')
        }
    })

app.get('/user/details', passport.authenticate('jwt', {session:false}), (req, res) => {
    try {
        const data = require('./users.json')
        res.status(200).json(data.find(user => user.email === req.user.email))
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.post('/ticket', middleware(schemas.createTicket), passport.authenticate('jwt', {session:false}), (req, res) => {
    try {
        var dataObj = require('./tickets.json')

        if (req.user.role === 'manager') {
            res.status(403).send('Access Denied')
        }
        else {

            let newTicket = {
                id: dataObj.length + 1,
                title: req.body.title,
                description: req.body.description,
                status: "open",
                createdBy: req.user.id,
                createdAt: (new Date()).toISOString().slice(0,19)
            }

            dataObj.push(newTicket)

            var updatedData = JSON.stringify(dataObj)
            fs.writeFile("tickets.json", updatedData, (err) => {
                if (err) throw err
                console.log("Data updated")
                res.status(201).send("Ticket created successfully")
            })
        }
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.get('/ticket', passport.authenticate('jwt', {session:false}), (req, res) => {
    try {
        const data = require('./tickets.json')
        let {status, page, limit, sortWith, sortBy} = req.query
        if(!page){
            page=1
        }
        if(!limit){
            limit=5
        }
        if(!sortBy || sortBy!== 'des'){
            sortBy = 'asc'
        }
        const size = parseInt(limit)
        const startIndex = (page-1)*size
        const endIndex = page*size
        if (!status) {
            if (req.user.role === 'manager') {
                if(sortBy==='des' && sortWith === 'createdAt'){
                    res.status(200).json(sortData(data).slice(startIndex,endIndex))
                }
                else{
                    res.status(200).json(data.slice(startIndex,endIndex))
                }
            }
            else {
                if(sortBy==='des' && sortWith === 'createdAt'){
                    res.status(200).json(sortData(data.filter(ticket => ticket.createdBy == req.user.id)).slice(startIndex,endIndex))
                }
                else{
                    res.status(200).json(data.filter(ticket => ticket.createdBy == req.user.id).slice(startIndex,endIndex))
                }
            }
        }
        else {
            if (req.user.role === 'manager') {
                if(sortBy==='des' && sortWith === 'createdAt'){
                    res.status(200).json(sortData(data.filter(ticket => ticket.status == req.query.status)).slice(startIndex,endIndex))
                }
                else{
                    res.status(200).json(data.filter(ticket => ticket.status == req.query.status).slice(startIndex,endIndex))
                }
            }
            else {
                if(sortBy==='des' && sortWith === 'createdAt'){
                    res.status(200).json(sortData(data.filter(ticket => ticket.createdBy == req.user.id).filter(ticket => ticket.status == req.query.status)).slice(startIndex,endIndex))
                }
                else{
                    res.status(200).json(data.filter(ticket => ticket.createdBy == req.user.id).filter(ticket => ticket.status == req.query.status).slice(startIndex,endIndex))
                }
            }
        }
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.put('/ticket/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    try {
        if (req.user.role === 'user') {
            res.status(403).send('Access Denied')
        }
        else {
            var data = require('./tickets.json')
            var index = data.findIndex((ticket => ticket.id == parseInt(req.params.id)))
            if (data[index].status === 'inprogress') {
                res.status(409).send('Status already updated')
            }
            else {
                data[index].status = 'inprogress'
                fs.writeFile("tickets.json", JSON.stringify(data), (err) => {
                    if (err) throw err
                    console.log("Data updated")
                    res.status(200).send("Ticket updated successfully")
                })
            }
        }
    }
    catch {
        res.status(503).send('Service Unavailable')
    }
})

app.listen(8000)