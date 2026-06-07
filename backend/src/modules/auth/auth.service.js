const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../../config/env');
const AppError = require('../../utils/app-error');
const usersRepository = require('../users/users.repository');

const signToken = (user) =>
  jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
      subject: String(user.id),
    },
  );

const register = async ({ name, email, password }) => {
  const existingUser = await usersRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);
  const user = await usersRepository.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    user,
    token: signToken(user),
  };
};

const login = async ({ email, password }) => {
  const user = await usersRepository.findByEmail(email, { withPassword: true });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { password: _password, ...safeUser } = user;

  return {
    user: safeUser,
    token: signToken(safeUser),
  };
};

module.exports = {
  login,
  register,
};
