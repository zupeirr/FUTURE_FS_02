import User from './src/models/User';
import bcrypt from 'bcryptjs';
import sequelize from './src/config/db';

async function createTestUser() {
  try {
    await sequelize.authenticate();
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@crm.com' },
      defaults: {
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    });

    if (created) {
      console.log('Test user created: admin@crm.com / password123');
    } else {
      console.log('Test user already exists.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
