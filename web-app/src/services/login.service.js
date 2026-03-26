import axios from '../api/axiosInstance';

export const login = async (email, password) => {
  try {
    const response = await axios.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await axios.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};