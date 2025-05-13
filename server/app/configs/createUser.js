const sequelize = require('./dbConfig'); 
const User = require('../models/User');

const createUser = async () => {
  try {
    await sequelize.sync();
    
    const user = await User.create({
      username: 'admin1',
      password: 'admin1',
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