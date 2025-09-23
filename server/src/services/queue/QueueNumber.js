
export const formatQueueNumber = (prefix, number) =>{
  const numDigits = number.toString().length;

    let paddedNumber;
    if (numDigits === 1) {
        paddedNumber = number.toString().padStart(2, '0'); // 1 digit → pad to 2 digits
    } else if (numDigits === 2) {
        paddedNumber = number.toString().padStart(3, '0'); // 2 digits → pad to 3 digits
    } else {
        paddedNumber = number.toString(); // 3 or more digits → no padding
    }

    return `${prefix}${paddedNumber}`;
}


