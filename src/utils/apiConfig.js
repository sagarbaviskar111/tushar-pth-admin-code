// const BASE_API_URL = "http://167.99.228.98:5000";  
// const BASE_API_URL = "http://localhost:5000";  
// const BASE_API_URL = "http://api.pharmatalenthub.in";  
// const BASE_API_URL = "https://api.pharmatalenthub.in";  
// const BASE_API_URL = "https://pharma-bharat-be.onrender.com";  

// Local Development
// const BASE_API_URL = "http://localhost:5000";

// Production
const BASE_API_URL = window.location.hostname === 'localhost' ? 'https://pharmatalenthub.in' : '';

export default BASE_API_URL;
export const NEXT_API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
