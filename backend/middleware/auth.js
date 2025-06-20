const jwt = require('jsonwebtoken');
const db = require('../database/connection');

/**
 * JWT认证中间件
 * 验证请求头中的Authorization token
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '缺少认证令牌'
      });
    }

    // 检查token格式 (Bearer <token>)
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误'
      });
    }

    const token = tokenParts[1];
    
    // 验证JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    let decoded;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 401,
          message: '认证令牌已过期'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          code: 401,
          message: '认证令牌无效'
        });
      } else {
        throw error;
      }
    }

    // 从数据库获取用户信息
    const user = await db.findOne('users', { id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '用户账号已被禁用'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      user_type: user.user_type,
      status: user.status
    };

    // 继续执行下一个中间件
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      code: 500,
      message: '认证验证失败',
      error: error.message
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，没有token则继续执行
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // 没有提供token，继续执行
      return next();
    }

    // 有token则进行验证
    await authMiddleware(req, res, next);
  } catch (error) {
    // 认证失败，但不阻止请求继续
    console.warn('可选认证失败:', error.message);
    next();
  }
};

/**
 * 生成JWT token
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const jwtExpiry = process.env.JWT_EXPIRY || '24h';
  
  const payload = {
    userId: user.id,
    username: user.username,
    user_type: user.user_type
  };

  return jwt.sign(payload, jwtSecret, { 
    expiresIn: jwtExpiry,
    issuer: 'class-management-system',
    audience: 'class-management-users'
  });
};

/**
 * 验证token（不通过中间件）
 */
const verifyToken = (token) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * 刷新token
 */
const refreshToken = async (oldToken) => {
  try {
    const decoded = verifyToken(oldToken);
    if (!decoded) {
      throw new Error('无效的令牌');
    }

    // 获取用户信息
    const user = await db.findOne('users', { id: decoded.userId });
    if (!user || user.status !== 'active') {
      throw new Error('用户不存在或已被禁用');
    }

    // 生成新token
    return generateToken(user);
  } catch (error) {
    throw error;
  }
};

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '用户未认证'
    });
  }

  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    });
  }

  next();
};

/**
 * 教师权限验证中间件
 */
const requireTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '用户未认证'
    });
  }

  if (!['admin', 'teacher'].includes(req.user.user_type)) {
    return res.status(403).json({
      code: 403,
      message: '需要教师或管理员权限'
    });
  }

  next();
};

/**
 * 学生权限验证中间件
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '用户未认证'
    });
  }

  if (!['admin', 'teacher', 'student'].includes(req.user.user_type)) {
    return res.status(403).json({
      code: 403,
      message: '需要学生、教师或管理员权限'
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  verifyToken,
  refreshToken,
  requireAdmin,
  requireTeacher,
  requireStudent
};