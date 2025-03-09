const express = require('express');

const app = express();

app.use(express.json());

app.post('/signup', function (req, res) {
  const { username, password } = req.body;

  // validate username
  if (!username) {
    return res.status(400).json({
      error: 'username is required',
    });
  }

  // validate password
  if (!password) {
    return res.status(400).json({
      error: 'password is required',
    });
  }
  if (password.length < 8) {
    return res.status(400).json({
      error: 'password must be at least 8 characters',
    });
  }

  return res.status(201).json();
});

app.get('/users/:userId', (req, res) => {
  const { userId } = req.params;

  if (userId !== 'penek') {
    return res.status(404).json();
  }

  return res.status(200).json({
    userId,
    username: 'hun',
    email: 'penekhun@gmail.com',
    friends: ['zagabi', 'json'],
  });
});

app.delete('/users/:userId/friends/:friendName', (req, res) => {
  const { userId, friendName } = req.params;

  if (userId !== 'penek') {
    return res.status(400).json();
  }

  if (friendName !== 'zagabi') {
    return res.status(404).json();
  }

  return res.status(204).json();
});

module.exports = app;
