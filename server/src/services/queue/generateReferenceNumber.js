// let sequenceCounter = 0;

// const generateReferenceNumber = () => {
//   const now = new Date();
//   const timestamp = now.getTime(); // milliseconds since epoch
//   sequenceCounter = (sequenceCounter + 1) % 1000; // Reset every 1000
//   const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  
//   return `Q-${datePart}-${sequenceCounter.toString().padStart(3, '0')}`;
// };
// for(let i = 0; i <=10000; i++){
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
// }

// // Example: Q-250918-001, Q-250918-002, etc.

import { v4 as uuidv4 } from 'uuid';

const generateReferenceNumber = () => {
  // Take first 12 characters of UUID for brevity
  const shortUuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  return `Q-${shortUuid}`;
};

for(let i = 0; i <=10000; i++){
    console.log(generateReferenceNumber())
    console.log(generateReferenceNumber())
    console.log(generateReferenceNumber())
    console.log(generateReferenceNumber())
}