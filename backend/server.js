const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/user');



// use body-parser middleware to receive the form data 
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(bodyParser.json(), urlencodedParser);

const dbURI = 'mongodb+srv://DreamUser:<password>@cluster0.gkzil.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
 
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then((res) => {
    app.listen(process.env.PORT, () => console.log('Server is live'))
})
.catch(err => console.log(err));

const app = express();

 app.post('/register', async (req, res) => {
    const user = req.body;

    // Checks if username or email has been taken by another user already
    const takenUsername = await User.findOne({ username: user.username });
    const takenEmail = await User.findOne({ email: user.email });

    if (takenUsername || takenEmail) {
        res.json({message: "Username or email has already been taken"});
    }
    else {
        user.password = await bcrypt.hash(req.body.password, 10);

        const dbUser = new User({
            username: user.username.toLowerCase(),
            email: user.email.toLowerCase(),
            password: user.password,
        })

        dbUser.save()
        res.join({message : "Success"})
    }
 });


 // Login In

 app.post('/login', (req, res) => {
    const userLoggingIn = req.body;

    User.findOne({username : userLoggingIn.username})
    .then(dbUser => {
        if (!dbUser) {
            return res.json({
                message: "Invalid Username and Password",
            })
        }
        bcrypt.compare(userLoggingIn.password, dbUser.password)
        .then(isCorrect => {
            if (isCorrect) {
                const payload = {
                id: dbUser._id,
                username : dbUser.username,
            }
            jwt.sign(
                payload, 
                process.env.JWT_SECRET, 
                {expiresIn: 86400},
                (err, token) => {
                    if (err) return res.json({message: err})
                    return res.json({
                        message : "Success",
                        token: "DreamBig" + token
                    })
                }
            )
        } else {
            return res.json({
                message: "Invalid Username or Password"
            })
        }
    })
})

})


// JSON Web Token

function verifyJWT(req, res, next) {
    const token = req.headers["x-access-token"]?.split('')[1]

    if (token) {
        jwt.verify(token, process.env.PASSPORTSECRET, (err, decoded) => {
            if (err) return res.json({
                isLoggedIn: false,
                message: "Failed to Authenticate",
            })
            req.user = {};
            req.user.id = decoded.id
            req.user.username = decoded.username
            next()
            
        }) 
    } else {
        res.json({message: "Incorrect Token Given", isLoggedIn: false})
    }
}



 