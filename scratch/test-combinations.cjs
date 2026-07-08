const axios = require('axios');

const baseUrl = 'https://gosynk-3xia.onrender.com';
const creds = {
  username: "2400030347",
  password: "erp@2005"
};

const combinations = [
  { academicYear: "2025-2026", semester: "odd" },
  { academicYear: "2025-2026", semester: "even" }
];

async function run() {
  for (const comb of combinations) {
    console.log(`\n=== Testing ATTENDANCE for ${comb.academicYear} / ${comb.semester} ===`);
    try {
      const response = await axios.post(`${baseUrl}/erp/attendance`, {
        erpCredentials: creds,
        academicContext: comb
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`Status: ${response.status}`);
      const text = response.data;
      console.log(text.slice(-500));
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
