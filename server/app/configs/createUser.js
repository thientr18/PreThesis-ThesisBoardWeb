const User = require('../models/User');
const sequelize = require('./dbConfig'); 

const createUser = async () => {
  try {
    await sequelize.sync();
    
    const user = await User.create({
      username: 'manager',
      password: 'manager',
      role: 'admin',
    });

    console.log('User created:', user.toJSON());
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sequelize.close();
  }
};

createUser();