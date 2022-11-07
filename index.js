const express = require("express")
const cors = require("cors")
const { connection }= require("./config/db")
const { UserModel } = require("./models/UserModel")
const {authentication} = require("./middlewares/authentication")
const { BMIModel } = require("./models/BMIModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const app = express()
app.use(cors())

app.use(express.json())

const PORT = process.env.PORT || 8001


app.get("/", (req,res)=>{
    res.send("Welcome")
})

//SIGN UP

app.post("/signup", async (req, res) => {
    const {name, email, password} = req.body

    const isUser = await UserModel.findOne({email})
    if(isUser){
        res.send({"message" : "User already exists, try logging in"})
    }
    else {
        bcrypt.hash(password, 4, async function(err, hash) {
        if(err){
            res.send({"message" :"Something went wrong, please try again later"})
        }
        const new_user = new UserModel({
            name,
            email,
            password : hash
        })
        try{
            await new_user.save()
            res.send({"message" : "Sign up successfull"})
        }
        catch(err){
            res.send({"message" : "Something went wrong, please try again"})
        }
    });
}
})

//LOGIN

app.post("/login", async (req, res) => {
    const {email, password} = req.body
    const user = await UserModel.findOne({email})
    const hashed_password = user.password;
    const user_id = user._id;
    console.log(user)
    console.log(user_id)
    bcrypt.compare(password, hashed_password, function(err, result) {
          if(err){
            res.send({"message" : "Something went wrong, try again later"})
          }
          if(result){
            const token = jwt.sign({user_id}, process.env.SECRET_KEY);  
            res.send({message : "Login Successfull", token})
          }
          else{
            res.send({"message" : "Login Failed"})
          }
    });
})

//GET USER PROFILE

app.get("/userdetail", authentication, async (req, res) => {
    const {user_id} = req.body
    const user =await  UserModel.findOne({_id : user_id})
    const {name, email} = user
    res.send({name, email})
})

//CALCULATE BMI(BODY MASS INDEX)

app.post("/BMIcalc", authentication, async (req, res) => {
    const {height, weight, user_id} = req.body;
    const height_in_metre = Number(height)*0.3048
    const BMI = Number(weight)/(height_in_metre)**2
    const new_bmi = new BMIModel({
       BMI,
       height : height_in_metre,
       weight,
       user_id
    })
    await new_bmi.save()
    res.send({BMI})
})

//ALL BMI DATA

app.get("/allBMI", authentication, async (req, res) => {
    const {user_id} = req.body;
    const all_bmi = await BMIModel.find({user_id : user_id})
    res.send({history : all_bmi})
})

//LISTENING AND DB CONNECTION

app.listen(PORT, async () => {
    try{
        await connection
        console.log("Connection to DB successfully")
    }
    catch(err){
        console.log("Error connecting to DB")
        console.log(err)
    }
    console.log(`Listening on PORT ${PORT}`)
})