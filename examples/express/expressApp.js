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

app.get('/users', (req, res) => {
  const { page, size } = req.query;

  const members = [
    { username: 'penekhun', name: 'seonghun' },
    { username: 'zagabi', name: 'hongchul' },
    { username: 'json', name: 'jaesong' },
    { username: 'clearlove', name: 'sangho' },
    { username: 'dopa', name: 'sanggil'},
    { username: 'ageis26', name: 'chanheok'}
  ]

  if (page === undefined) {
    return res.status(400).json({ error: 'page are required' });
  }

  if (size === undefined) {
    return res.status(400).json({ error: 'size are required' });
  }

  // sample pagination
  const pageNumber = parseInt(page);
  const sizeNumber = parseInt(size);
  const startIndex = (pageNumber - 1) * sizeNumber;
  const endIndex = startIndex + sizeNumber;

  const result = members.slice(startIndex, endIndex);
  return res.status(200).json({
    page: pageNumber,
    size: sizeNumber,
    total: members.length,
    members: result,
  });
})

module.exports = app;
