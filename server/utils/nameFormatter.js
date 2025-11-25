export const capitalizeFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '';

  return fullName
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }

      if (word.includes("'")) {
        return word
          .split("'")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("'");
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
