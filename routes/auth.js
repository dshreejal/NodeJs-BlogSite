const express = require('express')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require("../models/User");
const FetchUser = require('../middleware/FetchUser')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv/config')
const JWT_SECRET = process.env.JWT_SECRET

//ROUTE 1: Create a new user using: POST "/api/auth/createuser"
router.post("/createuser", [
    body('fname', 'Enter a valid first name').isLength({ min: 3 }),
    body('lname', 'Enter a valid last name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    // Find the validation errors in this request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        //If there are errors, return Bad Request and the errors
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ error: "Sorry a user with this email already exixts" })
        }

        //Create Salt to add with password for security
        const salt = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(req.body.password, salt);

        //Create a new User
        user = await User.create({
            fname: req.body.fname,
            lname: req.body.lname,
            name: req.body.fname + " " + req.body.lname,
            email: req.body.email,
            password: securePassword,
        });

        //get data using id for authToken
        const data = {
            user: {
                id: user.id
            }
        }

        //Create an authToken for the user to login easily
        const authToken = jwt.sign(data, JWT_SECRET);

        //Response
        res.json({ authToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});


//ROUTE 2: Authenticate a user using: POST "/api/auth/login".
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').isLength({ min: 5 }),
], async (req, res) => {
    //If there are errors, return Bad Request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            success = false;
            return res.status(400).json({ error: "Please try to login using correct Credentials" })
        }

        //Compare password given by user and password present in data base
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ error: "Please try to login using correct Credentials" })
        }

        const data = {
            user: {
                id: user.id
            }
        }

        //Create an authToken for the user to login easily
        const authToken = jwt.sign(data, JWT_SECRET)

        //Response
        res.json({ authToken })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//ROUTE 3: Get logged in user data using: POST "/api/auth/getuserdata". Requires user to be logged in.
router.post('/getuserdata', FetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router