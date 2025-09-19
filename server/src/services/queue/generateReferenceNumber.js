
const generateReferenceNumber = (today, queueType, queueNumber, sessionNo) =>{

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');

  const formattedDate = `${yyyy}${mm}${dd}`;
  const typeMap = {
    PRIORITY: 'P',
    REGULAR: 'R'
  };
  const formattedQueueType = typeMap[queueType.toUpperCase()] || 'X';
  const formattedSession = `S${sessionNo}`
  const formattedNumber =String(queueNumber).padStart(4, '0');


  return `${formattedDate}-${formattedSession}-${formattedQueueType}-${formattedNumber}`



}
export default generateReferenceNumber;


// let sequenceCounter = 0;

// const generateReferenceNumber = () => {
  
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


// for(let i = 0; i <=10000; i++){
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
//     console.log(generateReferenceNumber())
// }