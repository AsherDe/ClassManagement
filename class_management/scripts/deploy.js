#!/usr/bin/env node

/**
 * 生产环境部署脚本
 * 用于在Vercel部署时初始化数据库
 */

import { execSync } from 'child_process';

console.log('🚀 开始部署流程...');

try {
  // 生成Prisma客户端
  console.log('📦 生成Prisma客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 推送数据库架构
  console.log('🗄️ 同步数据库架构...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ 部署完成！');
} catch (error) {
  console.error('❌ 部署失败:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}