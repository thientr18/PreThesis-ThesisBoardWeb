const Admin = require('../models/Admin');
const sequelize = require('./dbConfig'); 

const createAdmin = async () => {
  try {
    await sequelize.sync();
    
    const user = await Admin.create({
      fullName: 'Admin',
      email: 'admin1@gmail.com',
      phone: '1234561219',
      birthDate: Date.now(),
      address: '123 Admin Street',
      userId: 3
    });

    console.log('Admin created:', user.toJSON());
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sequelize.close();
  }
};

createAdmin();