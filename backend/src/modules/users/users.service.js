const bcrypt = require('bcrypt');

const config = require('../../config/env');
const AppError = require('../../utils/app-error');
const usersRepository = require('./users.repository');

const getUsers = (query) => usersRepository.findAll(query);

const getUserById = async (id) => {
  const user = await usersRepository.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const getCurrentUser = (userId) => getUserById(userId);

const updateUser = async (id, data) => {
  const existingUser = await usersRepository.findById(id);

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (data.email && data.email !== existingUser.email) {
    const userWithEmail = await usersRepository.findByEmail(data.email);

    if (userWithEmail) {
      throw new AppError('Email already exists', 409);
    }
  }

  if (data.phone && data.phone !== existingUser.phone) {
    const userWithPhone = await usersRepository.findByPhone(data.phone);

    if (userWithPhone) {
      throw new AppError('Phone already exists', 409);
    }
  }

  const updateData = { ...data };

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, config.bcryptSaltRounds);
  }

  return usersRepository.update(id, updateData);
};

const deleteUser = async (id) => {
  const existingUser = await usersRepository.findById(id);

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  return usersRepository.remove(id);
};

module.exports = {
  deleteUser,
  getCurrentUser,
  getUserById,
  getUsers,
  updateUser,
};
