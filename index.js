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




// post usernames to the DB
app.post('/api/users', async (req,res)=>{
  
  let name = req.body.username
  const usName = new User({
    username: name
  })
  const usersCount = await User.find({})
  let len = usersCount.length+1
  console.log(len)
  const saveNewUser = await usName.save()
  console.log("User saved:")
  console.log(saveNewUser)
  return !name ? res.json({error: "Enter a username"}) : res.json({username:usName.username,_id:usName._id})
})

// get list of usernames from users collection
app.get('/api/users/', async (req,res)=>{
  const getUsers = await User.find().select("_id username")

  try{
    console.log(getUsers)
    res.json(getUsers)
  }
  catch(err){
    console.log(err)
    res.send("User not found") 
  }


})
app.get('/api/users/:_id/exercises',async (req,res)=>{
  // let description = req.body.description;
  // let duration  = req.body.duration;
  // let date = req.body.date;
  let id = req.params._id;

  try{
    const userId = await User.findById(id)
    const exercise = await Exercise.findById(id)

    if(!userId){
      res.send("User not found")
    }
    else if(!exercise){
      res.send("Exercise not listed")
    }
    else{
     
      // console.log(log)

      res.json({
        _id:userId._id,
        username: userId.username,
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
app.post('/api/users/:_id/exercises',async (req,res)=>{
  let { description, duration, date } = req.body
  let id = req.params._id;

  try{
    const userId = await User.findById(id)
    if(!userId){
      res.send("User not found & ID not found")
    }
    else{
      const exerciseObj = new Exercise({
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      const exercises = await Exercise.find({})
      //test to see if exercises are saved.
      const log = exercises.map(e=>({
        description,
        duration,
        date: e.date.toDateString()
      }))
      // console.log(log)

      res.json({
        _id:userId._id,
        username: userId.username,
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

app.get("/api/users/:_id/logs", async (req,res)=>{
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id)

  if(!user){
    res.send("User not found")
    return;
  }
  // build a filter query
  let dateObj = {};
   if(from){
    dateObj["$gte"] = new Date(from)
   }
   if(to){
    dateObj["$lte"] = new Date(to)
   }
  let filter = {_id:user._id}
  if(from||to){
    filter.date = dateObj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500)
  // const exercises = await Exercise.find({})

  const log = exercises.map(e=>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  res.json({
    username:user.username,
    count:exercises.length,
    _id: user._id,
    log
  })
  
})
const removeItems = async (res) => {
  let u = await User.deleteMany({})
  let e = await Exercise.deleteMany({})
  console.log("Deleted Items")
  console.log(u,e)
  res.sendFile(__dirname + '/views/drop.html')
}
// endpoint created to delete everything in db
app.get("/api/users/drop", async (req,res)=>{
  let count = await User.find({})
  let len = +count.length

  console.log(`len: ${len}` )
  switch(true){
    case len < 1:
      console.log("Nothing to remove")
      res.send("Nothing to remove")
    break;
    case len >= 1:
      removeItems(res)
    break;
    default:
    console.log(undefined)
  }
  
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
