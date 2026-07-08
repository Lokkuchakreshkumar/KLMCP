const axios = require('axios');

const baseUrl = 'https://gosynk-3xia.onrender.com';
const body = {
  erpCredentials: {
    username: "2400030347",
    password: "erp@2005"
  },
  academicContext: {
    academicYear: "2024-2025",
    semester: "odd"
  }
};

async function run() {
  for (const endpoint of ['/erp/attendance', '/erp/timetable', '/erp/internal-marks']) {
    console.log(`\n--- Testing ${endpoint} ---`);
    try {
      const response = await axios.post(`${baseUrl}${endpoint}`, body, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`Status: ${response.status}`);
      console.log(`Data slice:`, response.data.slice(0, 1000));
    } catch (error) {
      if (error.response) {
        console.error(`Error ${error.response.status}:`, error.response.data);
      } else {
        console.error(`Error:`, error.message);
      }
    }
  }
}

run();
