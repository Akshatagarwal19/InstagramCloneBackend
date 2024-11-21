const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_key';
const token = jwt.sign({ userId: '12345' }, JWT_SECRET, { expiresIn: '1h' });

console.log('Token:', token);

try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded:', decoded);
} catch (err) {
    console.error('Invalid token:', err);
}
