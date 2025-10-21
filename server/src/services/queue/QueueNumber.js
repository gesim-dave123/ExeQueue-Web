export const formatQueueNumber = (prefix, number) => {
  const paddedNumber = number.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
};
