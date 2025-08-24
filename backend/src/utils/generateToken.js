import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role) => {
  const secret = process.env.JWT_SECRET || 'dev_secret_key';
  const token = jwt.sign({ userId, role }, secret, {
    expiresIn: '30d',
  });

  return token;
};

export default generateToken;
