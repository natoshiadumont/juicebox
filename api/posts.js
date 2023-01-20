const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const postsRouter = express.Router();
const { getAllPosts, getPostById, updatePost } = require('../db');
const { requireUser } = require('./utils');


postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");
  next();
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  res.send({ message: 'under construction' });
});

postsRouter.get('/', async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      return post.active || (req.user && post.author.id === req.user.id);
    });

    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
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
    if (post) {
      console.log(post);
      res.send({ post })
    }
    // otherwise, next an appropriate error object 
  } catch ({ name, message }) {
    next({
      name: 'Trouble Creating a Post',
      message: 'Make sure to provide at least a title and content'
    });
  }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.postId);
    console.log(req.user);
    console.log(post);
    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });
      console.log(updatedPost);
      res.send({ post: updatedPost });
    } else {
      // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
      next(post ? {
        name: "UnauthorizedUserError",
        message: "You cannot delete a post which is not yours"
      } : {
        name: "PostNotFoundError",
        message: "That post does not exist"
      });
    }

  } catch ({ name, message }) {
    next({ name, message })
  }
});

module.exports = postsRouter;