import nodemailer from 'nodemailer';

// This function creates a temporary test account on Ethereal
// and returns a transporter object to send emails.
export const createTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();

  console.log('ETHEREAL TEST ACCOUNT:');
  console.log('=======================');
  console.log('User:', testAccount.user);
  console.log('Pass:', testAccount.pass);
  console.log('=======================');
  console.log('Preview emails at:', nodemailer.getTestMessageUrl(null)); // To see all messages

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};