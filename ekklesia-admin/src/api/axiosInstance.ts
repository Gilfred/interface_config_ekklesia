import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Replace with your actual API base URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ekklesia-token'); // Or wherever you store your token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;


// {
//   "amount": 100,
//   "phone_number": "0197000000",
//   "email": "toto@gmail.com",
//   "fullname": "Test User",
//   "type": "don"
// }
