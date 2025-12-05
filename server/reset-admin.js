const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function resetAdmin() {
  try {
    // 使用原生MongoDB连接
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/my-blog';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('已连接到MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 查找现有admin用户
    const existingUser = await usersCollection.findOne({ username: 'admin' });
    
    if (existingUser) {
      console.log('找到现有admin用户，准备更新密码...');
      
      // 更新现有用户密码
      const passwordHash = await bcrypt.hash('admin123', 10);
      await usersCollection.updateOne(
        { username: 'admin' },
        { 
          $set: { 
            passwordHash,
            updatedAt: new Date()
          }
        }
      );
      console.log('密码更新成功');
    } else {
      console.log('没有找到admin用户，创建新的...');
      
      // 创建新的管理员账户
      const passwordHash = await bcrypt.hash('admin123', 10);
      const user = {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(user);
      console.log('管理员账户创建成功');
      console.log('用户ID:', user._id);
    }
    
    console.log('\n管理员账户信息:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('邮箱: admin@example.com');
    
    await client.close();
    
  } catch (error) {
    console.error('操作失败:', error.message);
    
    // 如果mongodb模块未安装，使用mongoose替代
    if (error.message.includes('Cannot find module')) {
      console.log('\nmongodb模块未安装，尝试使用mongoose...');
      try {
        const User = mongoose.model('User');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/my-blog');
        console.log('已连接到MongoDB (通过mongoose)');
        
        let existingUser = await User.findOne({ username: 'admin' });
        
        if (existingUser) {
          console.log('找到现有admin用户，准备更新密码...');
          const passwordHash = await bcrypt.hash('admin123', 10);
          existingUser.passwordHash = passwordHash;
          await existingUser.save();
          console.log('密码更新成功');
        } else {
          console.log('没有找到admin用户，创建新的...');
          const passwordHash = await bcrypt.hash('admin123', 10);
          const user = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            passwordHash,
            role: 'admin'
          });
          console.log('管理员账户创建成功');
        }
        
        console.log('\n管理员账户信息:');
        console.log('用户名: admin');
        console.log('密码: admin123');
        console.log('邮箱: admin@example.com');
        
      } catch (mongooseError) {
        console.error('mongoose操作也失败:', mongooseError.message);
      }
    }
  }
}

resetAdmin();