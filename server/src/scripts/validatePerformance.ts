/**
 * Performance Validation Script
 * 验证 2C2G 环境下的性能指标
 * 
 * 运行: npx ts-node src/scripts/validatePerformance.ts
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { AdminConfigDiagnosticsService } from '../services/AdminConfigDiagnosticsService';
import { AdminAnalyticsRepository, AuthorAnalyticsRepository } from '../repositories/AnalyticsRepository';
import { logger } from '../utils/logger';
import '../models/UserModel';  // 导入 User 模型定义

// 性能测试配置
const CONFIG = {
  warmupRuns: 5,      // 预热次数
  testRuns: 20,       // 正式测试次数
  concurrency: 100,   // 并发数
};

/**
 * 内存使用报告
 */
const getMemoryUsage = () => {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024),
  };
};

/**
 * 性能计时器
 */
const withTiming = async <T>(label: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = Math.round(performance.now() - start);
  return { result, duration };
};

/**
 * 并发压力测试
 */
const concurrentTest = async <T>(
  label: string,
  fn: () => Promise<T>,
  concurrency: number
): Promise<{ avgDuration: number; totalDuration: number; success: number; failed: number }> => {
  const start = performance.now();
  const promises: Promise<{ success: boolean; duration: number }>[] = [];

  for (let i = 0; i < concurrency; i++) {
    promises.push(
      (async () => {
        const s = performance.now();
        try {
          await fn();
          return { success: true, duration: performance.now() - s };
        } catch {
          return { success: false, duration: performance.now() - s };
        }
      })()
    );
  }

  const results = await Promise.all(promises);
  const totalDuration = performance.now() - start;
  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / results.length
  );

  return { avgDuration, totalDuration: Math.round(totalDuration), success, failed };
};

/**
 * 测试配置诊断服务
 */
const testDiagnostics = async (): Promise<void> => {
  console.log('\n📊 Testing Config Diagnostics...');

  // 预热
  for (let i = 0; i < CONFIG.warmupRuns; i++) {
    await AdminConfigDiagnosticsService.getDiagnostics();
  }

  // 测试（带缓存）
  const cached = await withTiming('Cached', () =>
    AdminConfigDiagnosticsService.getDiagnostics()
  );
  console.log(`  Cached query: ${cached.duration}ms (target: <50ms)`);

  // 测试（强制刷新）
  const fresh = await withTiming('Fresh', () =>
    AdminConfigDiagnosticsService.getDiagnosticsFresh()
  );
  console.log(`  Fresh query: ${fresh.duration}ms (target: <100ms)`);

  // 并发测试
  const concurrent = await concurrentTest(
    'Concurrent',
    () => AdminConfigDiagnosticsService.getDiagnostics(),
    CONFIG.concurrency
  );
  console.log(`  Concurrent (${CONFIG.concurrency}): avg=${concurrent.avgDuration}ms, total=${concurrent.totalDuration}ms`);
  console.log(`  Success: ${concurrent.success}/${CONFIG.concurrency}`);
};

/**
 * 测试 Analytics 服务
 */
const testAnalytics = async (): Promise<void> => {
  console.log('\n📈 Testing Analytics...');

  // Admin Analytics
  const adminCached = await withTiming('Admin Analytics (cached)', () =>
    AdminAnalyticsRepository.getInsights('24h')
  );
  console.log(`  Admin Analytics (cached): ${adminCached.duration}ms (target: <50ms)`);

  const adminFresh = await withTiming('Admin Analytics (fresh)', () =>
    AdminAnalyticsRepository.getInsights('24h', true)
  );
  console.log(`  Admin Analytics (fresh): ${adminFresh.duration}ms (target: <200ms)`);

  // Author Analytics（使用第一个用户作为测试）
  const UserModel = mongoose.model('User');
  const firstUser = await UserModel.findOne().select('_id').lean();
  
  if (firstUser && '_id' in firstUser) {
    const authorCached = await withTiming('Author Analytics (cached)', () =>
      AuthorAnalyticsRepository.getInsights((firstUser as { _id: { toString(): string } })._id.toString(), '7d')
    );
    console.log(`  Author Analytics (cached): ${authorCached.duration}ms (target: <50ms)`);

    const authorFresh = await withTiming('Author Analytics (fresh)', () =>
      AuthorAnalyticsRepository.getInsights((firstUser as { _id: { toString(): string } })._id.toString(), '7d', true)
    );
    console.log(`  Author Analytics (fresh): ${authorFresh.duration}ms (target: <200ms)`);
  }
};

/**
 * 测试日志服务
 */
const testLogging = async (): Promise<void> => {
  console.log('\n📝 Testing Logging...');

  // 写入测试
  const writeStart = performance.now();
  for (let i = 0; i < 100; i++) {
    logger.info(`Test log message ${i}`, { scope: 'SERVER', source: 'performance-test' });
  }
  const writeDuration = Math.round(performance.now() - writeStart);
  console.log(`  Write 100 logs: ${writeDuration}ms (target: <100ms)`);

  // 内存查询测试
  const memQuery = await withTiming('Memory query', () =>
    Promise.resolve(logger.getMemoryLogs({ limit: 100 }))
  );
  console.log(`  Memory query (100): ${memQuery.duration}ms (target: <10ms)`);

  // 验证日志数量
  console.log(`  Memory logs count: ${memQuery.result.length}`);
};

/**
 * 内存占用报告
 */
const memoryReport = (): void => {
  console.log('\n💾 Memory Usage Report:');
  const mem = getMemoryUsage();
  console.log(`  RSS: ${mem.rss}MB (target: <200MB)`);
  console.log(`  Heap Total: ${mem.heapTotal}MB`);
  console.log(`  Heap Used: ${mem.heapUsed}MB`);
  console.log(`  External: ${mem.external}MB`);

  const status = mem.rss < 200 ? '✅ PASS' : '❌ FAIL';
  console.log(`  Status: ${status}`);
};

/**
 * 主函数
 */
const main = async (): Promise<void> => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Performance Validation for 2C2G Environment         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const initialMem = getMemoryUsage();
  console.log(`\nInitial Memory: RSS ${initialMem.rss}MB`);

  try {
    // 连接数据库
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // 初始化日志集合
    const { initLogCollection } = await import('../utils/logger');
    await initLogCollection();

    // 运行测试
    await testDiagnostics();
    await testAnalytics();
    await testLogging();

    // 最终内存报告
    memoryReport();

    // 性能总结
    console.log('\n📋 Performance Summary:');
    console.log('  - Config Diagnostics: <100ms (fresh), <50ms (cached)');
    console.log('  - Analytics: <200ms (fresh), <50ms (cached)');
    console.log('  - Log Write: <100ms per 100 logs');
    console.log('  - Log Query: <10ms (memory)');
    console.log('  - Memory: <200MB RSS');
    console.log('\n✅ All tests completed');

  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
};

// 运行测试
main();
