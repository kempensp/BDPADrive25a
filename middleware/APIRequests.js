const https = require('https');

// Module for handling API requests to BDPADrive API
module.exports = {

  // GET call function with Bearer token
  getWithBearerToken: function (url, token) {
    const options = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.get(url, options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              data: data ? JSON.parse(data) : null
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.end();
    });
  },

  // POST call function with Bearer token
  postWithBearerToken: function (url, token, data) {
    const postData = JSON.stringify(data);

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, res => {
        let responseData = '';
        res.on('data', chunk => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : null
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  },

  // PUT call function with Bearer token
  putWithBearerToken: function (url, token, data) {
    const putData = JSON.stringify(data);

    const options = {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(putData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, res => {
        let responseData = '';
        res.on('data', chunk => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : null
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.write(putData);
      req.end();
    });
  }
};