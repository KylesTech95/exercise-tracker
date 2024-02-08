const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bP = require('body-parser')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// connect mongoose client
mongoose.connect(process.env.URI)
// create 2 databases in client & create collections for each db
const exerciseSchema = new Schema({
username:{type:String},
description: {type:String},
duration: Number,
date: Date
})
const Exercise = mongoose.model('Exercise',exerciseSchema)
//________________________________
const userSchema = new Schema({
  username: {type:String,required:true}
})
const User = mongoose.model('User',userSchema)
//________________________________



app.use(cors())
app.use(express.json())
app.use(bP.urlencoded({extended:true}))
app.use(bP.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// post /api/users
app.post('/api/users', async (req,res)=>{
  let name = req.body.username
  const usName = new User({
    username: name
  })
  const saveNewUser = await usName.save()
  return !name ? res.json({error: "Enter a username"}) : res.json({username:usName.username,_id:usName._id})
})

// get list of usernames from users collection
app.get('/api/users/', async (req,res)=>{
  const getUsers = await User.find()
  // for fun: access getUsers array and returning the usernames only
  let arr = [];
  for(let i = 0; i < getUsers.length; i++){
    console.log(getUsers[i])
    arr.push(getUsers[i].username)
  }
  // returning getUsers array
  res.json(getUsers)

})

app.post('/api/users/:_id/exercises',async (req,res)=>{
  let description = req.body.description;
  let duration  = req.body.duration;
  let date = req.body.date;
  let id = req.params._id;

  try{
    const userId = await User.findById(id)
    if(!userId){
      res.send("User not found")
    }
    else{
      const exerciseObj = new Exercise({
        _id: userId._id,
        username: userId.username,
        description: description,
        duration:duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id:exercise._id,
        username: exercise.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  }
  catch(err){
    console.log(err)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
