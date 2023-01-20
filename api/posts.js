const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const postsRouter = express.Router();
const { getAllPosts } = require('../db');
const { requireUser } = require('./utils');


postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");
  next();
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  res.send({ message: 'under construction' });
});

postsRouter.get('/', async (req, res) => {
  const posts = await getAllPosts();

  res.send({
    posts
  });
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/)
  const postData = {};

  // only send the tags if there are some to send
  if (tagArr.length > 0) {
    postData.tags = tagArr;
  }

  try {
    //get token from Bearer Token 
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');
    const token = auth.slice(prefix.length);
    console.log(token);
    const { id } = jwt.verify(token, JWT_SECRET);
    req.user = await getUserById(id);

    // add authorId, title, content to postData object
    postData.authorID = id;
    postData.title = title;
    postData.content = content;

    const post = await createPost(postData);
    
    // this will create the post and the tags for us
    // if the post comes back, res.send({ post });
    if(post){
      console.log(post);
      res.send({post})
    }
    // otherwise, next an appropriate error object 
  } catch ({ name, message }) {
    next({ 
      name: 'Trouble Creating a Post',
      message: 'Make sure to provide at least a title and content'});
  }
});


module.exports = postsRouter;