require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AdminUser = require('../models/AdminUser.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const Assignment = require('../models/Assignment.model');

// ─── Sample Data ────────────────────────────────────────────────────────────

const adminData = {
  name: 'Super Admin',
  email: 'admin@lms.com',
  password: 'admin123',
  role: 'superadmin',
};

const booksData = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', category: 'Fiction', publisher: 'Scribner', publishedYear: 1925, totalCopies: 5 },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', category: 'Fiction', publisher: 'HarperCollins', publishedYear: 1960, totalCopies: 4 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-553-38016-3', category: 'Science', publisher: 'Bantam Books', publishedYear: 1988, totalCopies: 3 },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-13-235088-4', category: 'Technology', publisher: 'Prentice Hall', publishedYear: 2008, totalCopies: 6 },
  { title: 'Sapiens: A Brief History', author: 'Yuval Noah Harari', isbn: '978-0-06-231609-7', category: 'History', publisher: 'Harper', publishedYear: 2011, totalCopies: 4 },
  { title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '978-0-13-595705-9', category: 'Technology', publisher: 'Addison-Wesley', publishedYear: 1999, totalCopies: 3 },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '978-0-7352-1129-2', category: 'Self-Help', publisher: 'Avery', publishedYear: 2018, totalCopies: 7 },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0-307-88791-7', category: 'Business', publisher: 'Currency', publishedYear: 2011, totalCopies: 3 },
  { title: 'Steve Jobs', author: 'Walter Isaacson', isbn: '978-1-4516-4853-9', category: 'Biography', publisher: 'Simon & Schuster', publishedYear: 2011, totalCopies: 2 },
  { title: 'Design of Everyday Things', author: 'Don Norman', isbn: '978-0-465-06710-7', category: 'Art & Design', publisher: 'Basic Books', publishedYear: 2013, totalCopies: 4 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0-374-27563-1', category: 'Self-Help', publisher: 'Farrar Straus & Giroux', publishedYear: 2011, totalCopies: 5 },
  { title: 'The Art of War', author: 'Sun Tzu', isbn: '978-1-59030-225-0', category: 'Philosophy', publisher: 'Shambhala', publishedYear: 2005, totalCopies: 6 },
];

const usersData = [
  { name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '9876543210', role: 'Member', status: 'Active' },
  { name: 'Priya Patel', email: 'priya.patel@email.com', phone: '9123456789', role: 'Member', status: 'Active' },
  { name: 'Rahul Kumar', email: 'rahul.kumar@email.com', phone: '9988776655', role: 'Librarian', status: 'Active' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@email.com', phone: '9765432100', role: 'Member', status: 'Active' },
  { name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '9654321098', role: 'Member', status: 'Inactive' },
  { name: 'Meera Nair', email: 'meera.nair@email.com', phone: '9543210987', role: 'Admin', status: 'Active' },
  { name: 'Karthik Iyer', email: 'karthik.iyer@email.com', phone: '9432109876', role: 'Member', status: 'Active' },
  { name: 'Ananya Verma', email: 'ananya.verma@email.com', phone: '9321098765', role: 'Member', status: 'Active' },
];

// ─── Seed Function ───────────────────────────────────────────────────────────
const seedDB = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seeding...\n');

    // Clear existing data
    await Promise.all([
      AdminUser.deleteMany({}),
      Book.deleteMany({}),
      User.deleteMany({}),
      Assignment.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed admin
    const admin = await AdminUser.create(adminData);
    console.log(`✅ Admin created: ${admin.email}`);

    // Seed books
    const books = await Book.insertMany(booksData);
    console.log(`✅ ${books.length} books inserted`);

    // Seed users
    const users = await User.insertMany(usersData);
    console.log(`✅ ${users.length} library members inserted`);

    // Create sample assignments (2 books issued)
    const dueDate1 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const dueDate2 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);  // 2 days ago (overdue)

    await Assignment.create([
      {
        book: books[0]._id,
        user: users[0]._id,
        bookTitle: books[0].title,
        bookIsbn: books[0].isbn,
        userName: users[0].name,
        userEmail: users[0].email,
        memberId: users[0].memberId,
        dueDate: dueDate1,
        issuedBy: admin._id,
      },
      {
        book: books[2]._id,
        user: users[1]._id,
        bookTitle: books[2].title,
        bookIsbn: books[2].isbn,
        userName: users[1].name,
        userEmail: users[1].email,
        memberId: users[1].memberId,
        dueDate: dueDate2,
        issuedBy: admin._id,
      },
    ]);

    // Update copy counts for issued books
    await Book.findByIdAndUpdate(books[0]._id, { $inc: { availableCopies: -1 } });
    await Book.findByIdAndUpdate(books[2]._id, { $inc: { availableCopies: -1 } });

    console.log('✅ 2 sample assignments created');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Database seeded successfully!\n');
    console.log('🔐 Admin Login Credentials:');
    console.log(`   Email   : ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
