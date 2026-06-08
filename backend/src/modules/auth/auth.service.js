const bcrypt = require('bcrypt');

const config = require('../../config/env');
const AppError = require('../../utils/app-error');
const usersRepository = require('../users/users.repository');
const { signToken } = require('./auth-token');

const protectedPages = {
  'account.html': {
    page: 'account',
    message: 'H?y ??ng nh?p ?? xem t?i kho?n',
    roles: ['USER', 'ADMIN'],
  },
  'cart.html': {
    page: 'cart',
    message: 'Hãy đăng nhập để xem giỏ hàng',
    roles: ['USER', 'ADMIN'],
  },
  'checkout.html': {
    page: 'cart',
    message: 'Hãy đăng nhập để thanh toán',
    roles: ['USER', 'ADMIN'],
  },
  'checkout-success.html': {
    page: 'cart',
    message: 'Hãy đăng nhập để xem đơn hàng',
    roles: ['USER', 'ADMIN'],
  },
  'room-3d.html': {
    page: 'room-3d',
    message: 'Hãy đăng nhập để trải nghiệm mô phỏng 3D',
    roles: ['USER', 'ADMIN'],
  },
};

const normalizePath = (value = '') =>
  value
    .replace(/^\/+/, '')
    .split('?')[0]
    .split('#')[0]
    .trim()
    .toLowerCase();

const normalizePagePath = (value = '') =>
  normalizePath(value)
    .split('/')
    .pop()
    .trim();

const register = async ({ name, email, phone, password }) => {
  const existingUser = await usersRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  if (phone) {
    const existingPhone = await usersRepository.findByPhone(phone);

    if (existingPhone) {
      throw new AppError('Phone already exists', 409);
    }
  }

  const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);
  const user = await usersRepository.create({
    name,
    email,
    phone,
    password: hashedPassword,
  });

  return {
    user,
    token: signToken(user),
  };
};

const login = async ({ identifier, password }) => {
  const user = await usersRepository.findByEmailOrName(identifier, { withPassword: true });

  if (!user) {
    throw new AppError('Invalid username/email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid username/email or password', 401);
  }

  const { password: _password, ...safeUser } = user;

  return {
    user: safeUser,
    token: signToken(safeUser),
  };
};

const getPageAccess = ({ path = '', user = null } = {}) => {
  const normalizedFullPath = normalizePath(path);
  const normalizedPath = normalizePagePath(path);
  const isAdminPage = normalizedFullPath.startsWith('pages/admin/') || normalizedFullPath.startsWith('admin/');

  if (isAdminPage) {
    if (user?.role === 'ADMIN') {
      return {
        allowed: true,
        page: 'admin',
        protected: true,
        roles: ['ADMIN'],
        user,
      };
    }

    return {
      allowed: false,
      page: 'admin',
      protected: true,
      roles: ['ADMIN'],
      message: user
        ? 'Bạn không có quyền truy cập trang quản trị'
        : 'Hãy đăng nhập bằng tài khoản admin để vào trang quản trị',
      redirectPath: normalizedFullPath.replace(/^pages\//, ''),
      statusCode: user ? 403 : 401,
    };
  }

  const rule = protectedPages[normalizedPath];

  if (!rule) {
    return {
      allowed: true,
      page: normalizedPath,
      protected: false,
    };
  }

  if (user && (!rule.roles || rule.roles.includes(user.role))) {
    return {
      allowed: true,
      page: rule.page,
      protected: true,
      roles: rule.roles,
      user,
    };
  }

  if (user) {
    return {
      allowed: false,
      page: rule.page,
      protected: true,
      roles: rule.roles,
      message: 'Bạn không có quyền truy cập trang này',
      redirectPath: normalizedPath,
      statusCode: 403,
    };
  }

  return {
    allowed: false,
    page: rule.page,
    protected: true,
    roles: rule.roles,
    message: rule.message,
    redirectPath: normalizedPath,
    statusCode: 401,
  };
};

module.exports = {
  getPageAccess,
  login,
  register,
};
