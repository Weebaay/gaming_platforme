const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function createAdmin() {
  try {
    const response = await axios.post(`${API_URL}/users/register`, {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123!'
    });
    console.log('Admin créé avec succès:', response.data);
  } catch (error) {
    console.log('Erreur ou admin déjà existant:', error.response ? error.response.data : error.message);
  }
}

createAdmin(); 