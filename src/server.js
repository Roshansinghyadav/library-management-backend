require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 LMS Backend Server running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: MongoDB Connected`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api\n`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
