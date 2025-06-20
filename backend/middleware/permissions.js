const db = require('../database/connection');

/**
 * 权限验证中间件
 * 检查用户是否具有指定的权限
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证'
        });
      }

      // 查询用户权限
      const query = `
        SELECT 
          up.id,
          up.permission_id,
          up.is_active,
          up.expires_at,
          p.permission_key
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1 
          AND p.permission_key = $2 
          AND up.is_active = true
      `;

      const result = await db.query(query, [userId, permissionKey]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法访问此资源',
          required_permission: permissionKey
        });
      }

      const userPermission = result.rows[0];
      
      // 检查权限是否过期
      if (userPermission.expires_at) {
        const expiresAt = new Date(userPermission.expires_at);
        const now = new Date();
        
        if (expiresAt <= now) {
          return res.status(403).json({
            code: 403,
            message: '权限已过期',
            required_permission: permissionKey
          });
        }
      }

      // 权限验证通过，继续执行
      next();
    } catch (error) {
      console.error('权限验证失败:', error);
      res.status(500).json({
        code: 500,
        message: '权限验证失败',
        error: error.message
      });
    }
  };
};

/**
 * 多权限验证中间件
 * 检查用户是否具有指定权限中的任意一个
 */
const requireAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证'
        });
      }

      if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '权限配置错误'
        });
      }

      // 构建查询条件
      const placeholders = permissionKeys.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        SELECT 
          up.id,
          up.permission_id,
          up.is_active,
          up.expires_at,
          p.permission_key
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1 
          AND p.permission_key IN (${placeholders})
          AND up.is_active = true
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
      `;

      const params = [userId, ...permissionKeys];
      const result = await db.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法访问此资源',
          required_permissions: permissionKeys
        });
      }

      // 权限验证通过，继续执行
      next();
    } catch (error) {
      console.error('权限验证失败:', error);
      res.status(500).json({
        code: 500,
        message: '权限验证失败',
        error: error.message
      });
    }
  };
};

/**
 * 全权限验证中间件
 * 检查用户是否具有指定的所有权限
 */
const requireAllPermissions = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证'
        });
      }

      if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '权限配置错误'
        });
      }

      // 构建查询条件
      const placeholders = permissionKeys.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        SELECT 
          p.permission_key
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1 
          AND p.permission_key IN (${placeholders})
          AND up.is_active = true
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
      `;

      const params = [userId, ...permissionKeys];
      const result = await db.query(query, params);
      
      const userPermissions = result.rows.map(row => row.permission_key);
      const missingPermissions = permissionKeys.filter(key => !userPermissions.includes(key));
      
      if (missingPermissions.length > 0) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，缺少必要权限',
          required_permissions: permissionKeys,
          missing_permissions: missingPermissions
        });
      }

      // 权限验证通过，继续执行
      next();
    } catch (error) {
      console.error('权限验证失败:', error);
      res.status(500).json({
        code: 500,
        message: '权限验证失败',
        error: error.message
      });
    }
  };
};

/**
 * 用户类型验证中间件
 * 检查用户类型是否符合要求
 */
const requireUserType = (userTypes) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证'
        });
      }

      const allowedTypes = Array.isArray(userTypes) ? userTypes : [userTypes];

      // 查询用户类型
      const user = await db.findOne('users', { id: userId });
      
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在'
        });
      }

      if (!allowedTypes.includes(user.user_type)) {
        return res.status(403).json({
          code: 403,
          message: '用户类型不符合要求',
          user_type: user.user_type,
          required_types: allowedTypes
        });
      }

      // 验证通过，继续执行
      next();
    } catch (error) {
      console.error('用户类型验证失败:', error);
      res.status(500).json({
        code: 500,
        message: '用户类型验证失败',
        error: error.message
      });
    }
  };
};

/**
 * 获取用户权限列表
 */
const getUserPermissions = async (userId) => {
  try {
    const query = `
      SELECT 
        up.id,
        up.permission_id,
        up.is_active,
        up.expires_at,
        up.granted_at,
        p.permission_name,
        p.permission_key,
        p.category,
        p.description
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
      ORDER BY p.category, p.permission_name
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return [];
  }
};

/**
 * 检查用户是否有指定权限
 */
const hasPermission = async (userId, permissionKey) => {
  try {
    const query = `
      SELECT 1
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 
        AND p.permission_key = $2
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    `;

    const result = await db.query(query, [userId, permissionKey]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
};

/**
 * 权限常量定义
 */
const PERMISSIONS = {
  // 学生管理
  VIEW_STUDENTS: 'view_students',
  EDIT_STUDENTS: 'edit_students',
  
  // 成绩管理
  VIEW_GRADES: 'view_grades',
  INPUT_GRADES: 'input_grades',
  
  // 班级管理
  MANAGE_CLASS: 'manage_class',
  
  // 班费管理
  APPROVE_FUNDS: 'approve_funds',
  
  // 通知管理
  PUBLISH_NOTIFICATION: 'publish_notification',
  
  // 系统管理
  MANAGE_USERS: 'manage_users',
  SYSTEM_SETTINGS: 'system_settings',
  
  // 数据统计
  VIEW_STATISTICS: 'view_statistics'
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireUserType,
  getUserPermissions,
  hasPermission,
  PERMISSIONS
};