import bcrypt from 'bcryptjs';

const password = 'Admin@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Password hash for "Admin@123":');
  console.log(hash);
  process.exit(0);
});
