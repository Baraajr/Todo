const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const createJWTToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createAndSendToken = (user, status, req, res) => {
  // 1) create the token
  const token = createJWTToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure === true || req.headers['x-forwarded-proto'] === 'https',
  };

  //2) save the token to the cookies
  res.cookie('JWT', token, cookieOptions);

  //3) send the token in the response
  res.status(status).json({
    status: 'success',
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, passwordConfirm } = req.body;
  // 1)check the name is given
  // 2)check the email is unique (not used by any user)
  const user = await User.findOne({
    where: { email },
  });

  console.log(user);
  if (user) {
    throw new AppError('Email already exists', 400);
  }

  // 3)check the password equals the passwordConfirm
  if (password !== passwordConfirm) {
    throw new AppError('Passwords do not match', 400);
  }

  //4) create the user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  //log the user in by setting the cookies and send the token back
  createAndSendToken(newUser, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Find user by email or username
  const user = await User.findOne({ where: { email } });

  //2) Check if user exists and password is correct
  if (!user || !(await user.isCorrectPassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  //3) If everything is okay, send the token to the client and set the cookies
  createAndSendToken(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  // 1) Clear the cookie by setting its expiration to a date in the past
  res.cookie('JWT', '', {
    expires: new Date(Date.now() - 1000), // Expire the cookie immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure flag for production
  });

  //2) send the result
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) Check for token in Authorization header or cookies
  if (req.cookies.JWT) {
    token = req.cookies.JWT;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log(token);

  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please log in to access this route.',
        401,
      ),
    );
  }

  //2) Decode and verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    throw new AppError('User no longer exists', 401);
  }

  //4) Check if user changed password after token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   throw new AppError('User has changed password. Please log in again', 401);
  // }
  //5) Grant access to protected route
  req.user = currentUser;
  next();
});
