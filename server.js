const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./db/db');

// routes
const todoRoutes = require('./routes/todoRoutes');
const userRoutes = require('./routes/usersRoutes');

// connect db
connectDB();

const app = express();

// middlewares
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// routes

app.use('/api/v1/todos', todoRoutes);
app.use('/api/v1/users', userRoutes);

const errorHandler = require('./controllers/errorHandler');

// global error handling
app.use(errorHandler);

// not implemented yet
app.all('*', (req, res, next) => {
  res.status(404).json({ message: "route's not found" });
});

const port = 3000 || process.env.port;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
