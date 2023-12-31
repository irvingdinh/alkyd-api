export const randomString = (length: number = 16): string => {
  const alphaNumeric =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let str = '';
  for (let i = length; i > 0; --i)
    str += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];

  return str;
};
