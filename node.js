const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');


const database = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'weezy995',
      database : 'store'
    }
  });

// database.select('*').from('myusers').then(data => {
//     console.log(data);
// })

const app = express();
app.use(cors())
app.use(bodyParser.json());

app.post('/signup', (req, res) => {
    const {email, password, name} = req.body;
    const hash = bcrypt.hashSync(password);
    database.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('mylogin')
        .returning('email')
        .then(loginEmail => {
            return trx('myusers')
            .returning('*')
            .insert({
                name: name,
                email: loginEmail[0],
                joined: new Date()
            })
            .then(user => {
                res.json(user[0])
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.post('/signin', (req, res) => {
    database.select('email', 'hash').from('mylogin')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        console.log(data);
        if(isValid){
            return database.select('*').from('myusers')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        }else {
            res.status(400).json('wrong info')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})


app.put('/image', (req, res) => {
    const { id } = req.body;
    database('myusers')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entry => res.json(entry))
    .catch(err => res.status(400).json('unable to get entries'))

})

app.listen(process.event.PORT || 3002, () => {
    console.log(`server is running on port ${process.env.PORT}`)
});

// const PORT = process.env.PORT
// app.listen(PORT, () => {
//     console.log(`server is running on port ${PORT}`)
// });
// console.log(process.env)