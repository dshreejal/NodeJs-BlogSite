const express = require("express")
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FetchUser = require('../middleware/FetchUser')
const Blog = require("../models/Blog");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./images")
    }, filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage })

////ROUTE 1: Add a new blog using: POST "/api/blog/addblog". Login required
router.post('/addblog', upload.single('img'), FetchUser, async (req, res) => {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description } = req.body;
        const img = req.file.filename;
        const blog = new Blog({
            title, description, img, user: req.user.id
        })
        const savedBlog = await blog.save();
        res.json(savedBlog)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//ROUTE 2: Fetch all Blog using: GET "/api/blog/fetchblogs". Login not required
router.get('/fetchblogs', async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('user', 'name',);
        res.json(blogs)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//ROUTE 3: Fetch blog specific to a user using: GET "/api/blog/fetchuserblogs". Login required
router.get("/fetchuserblogs", FetchUser, async (req, res) => {
    try {
        const blogs = await Blog.find({ user: req.user.id }).populate('user', 'name',);
        res.json(blogs);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})


//Route 4: Fect blog by ID using: GET "/api/blog/:id". Login not required
router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('user', 'name',);
        res.json(blog);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 5: Delete a blog uisng: DELETE "/api/blog/deleteblog/:id". Login required
router.delete('/deleteblog/:id', FetchUser, async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (!blog) { return res.status(404).send("Not Found") }

        //Check if user logged in is accessing the blog or not to only allow logged in user to delete
        if (blog.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed")
        }
        blog = await Blog.findByIdAndDelete(req.params.id);
        res.json(blog)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})


module.exports = router;