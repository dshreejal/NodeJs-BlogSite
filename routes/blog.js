const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FetchUser = require('../middleware/FetchUser');
const Blog = require("../models/Blog");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// configure multer storage for cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    folder: "blog-images",
    allowedFormats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
});

// configure multer upload
const upload = multer({ storage: storage });

////ROUTE 1: Add a new blog using: POST "/api/blog/addblog". Login required
router.post(
    "/addblog",
    upload.single("img"),
    [
        body("title", "Title must be at least 3 characters long").isLength({
            min: 3,
        }),
        body("description", "Description must be at least 5 characters long").isLength(
            { min: 5 }
        ),
    ],
    FetchUser,
    async (req, res) => {
        // If there are errors, return Bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, description } = req.body;
            const img = req.file.path;
            const result = await cloudinary.uploader.upload(img);
            const blog = new Blog({
                title,
                description,
                img: result.secure_url,
                user: req.user.id,
            });
            const savedBlog = await blog.save();
            const data = {
                _id: savedBlog._id,
                user: savedBlog.user,
                title: savedBlog.title,
                description: savedBlog.description,
                img: savedBlog.img,
                date: savedBlog.date,
                __v: 0,
            };
            res.json(data);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }
    }
);

//ROUTE 2: Fetch all Blog using: GET "/api/blog/fetchblogs". Login not required
router.get('/fetchblogs', async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('user', 'name',);
        const data = blogs.map(blog => ({
            "_id": blog._id,
            "user": blog.user,
            "title": blog.title,
            "description": blog.description,
            "img": `"https"://${req.get(
                "host"
            )}/images/${blog.img}`,
            "date": blog.date,
            "__v": 0
        }));
        res.json(data)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//ROUTE 3: Fetch blog specific to a user using: GET "/api/blog/fetchuserblogs". Login required
router.get("/fetchuserblogs", FetchUser, async (req, res) => {
    try {
        const blogs = await Blog.find({ user: req.user.id }).populate('user', 'name',);
        const data = blogs.map(blog => ({
            "_id": blog._id,
            "user": blog.user,
            "title": blog.title,
            "description": blog.description,
            "img": `${req.secure ? "https" : "http"}://${req.get(
                "host"
            )}/images/${blog.img}`,
            "date": blog.date,
            "__v": 0
        }));
        res.json(data)
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})


//Route 4: Fect blog by ID using: GET "/api/blog/:id". Login not required
router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('user', 'name',);
        const data = {
            "_id": blog._id,
            "user": blog.user,
            "title": blog.title,
            "description": blog.description,
            "img": `${req.secure ? "https" : "http"}://${req.get(
                "host"
            )}/images/${blog.img}`,
            "date": blog.date,
            "__v": 0
        }
        res.json(data);
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