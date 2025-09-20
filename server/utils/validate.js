import crypto from 'crypto';

const validateAccess = () => {
  const accessKey = process.env.ACCESS_KEY;
  const accessKeyHash = process.env.ACCESS_KEY_HASH;

  try {
    if (!accessKey || !accessKeyHash) {
      throw new Error('Missing Credentials!');
    }
    const keyHash = crypto.createHash('md5').update(accessKey).digest('hex');
    if (keyHash !== accessKeyHash) {
      throw new Error('Invalid Acces Key!');
    }

    console.log('Access Validated!');
  } catch (error) {
    console.error('Error in Validation: ', error);
    process.exit(1);
  }
};

export default validateAccess;
