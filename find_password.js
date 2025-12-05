const bcrypt = require('./server/node_modules/bcryptjs');

// 管理员账户的密码hash
const passwordHash = '$2b$10$5z1zeciyBKu46jx3Od1w1.n2m/3G1fIIlMTi9i4GosBo96IosDVMK';

// 常见密码列表
const commonPasswords = [
  'admin',
  'admin123',
  'password',
  '123456',
  'password123',
  '123456789',
  'qwerty',
  'abc123',
  'password1',
  'admin@123',
  '1234567890',
  'abc123456',
  '88888888',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  '111111',
  '123123'
];

// 测试密码
async function testPasswords() {
  console.log('正在测试密码...');
  
  for (const password of commonPasswords) {
    try {
      const isMatch = await bcrypt.compare(password, passwordHash);
      if (isMatch) {
        console.log(`✅ 找到密码: "${password}"`);
        return password;
      } else {
        console.log(`❌ 不匹配: "${password}"`);
      }
    } catch (error) {
      console.error(`❌ 测试密码 "${password}" 时出错:`, error);
    }
  }
  
  console.log('❌ 在常见密码列表中未找到匹配的密码');
  return null;
}

// 运行测试
testPasswords();