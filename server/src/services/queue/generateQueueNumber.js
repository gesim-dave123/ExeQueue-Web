import { Queue_Type } from "@prisma/client"
import prisma from "../../../prisma/prisma.js"
export const generateQueueNumber = async(queueType)=>{
  try {
    
    if(!queueType) throw new Error("Queue Type is Missing")
    // Fixed validation logic and method name
    if (queueType.toLowerCase() !== Queue_Type.REGULAR.toString().toLowerCase() && 
        queueType.toLowerCase() !== Queue_Type.PRIORITY.toString().toLowerCase()) {
      throw new Error('Invalid Queue Type')
    }

    const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase() 
    ? Queue_Type.REGULAR
    : Queue_Type.PRIORITY


    return await prisma.$transaction(async (tx)=>{
      const today = new Date();
      today.setHours(0,0,0,0)

      const latest = await tx.queue.findFirst({
        where:{
          queueType: QUEUETYPE,
          createdAt: {gte:today}
        },
        orderBy:{
          queueNumber: 'desc'
        },
        select:{
          queueNumber: true
        }
      })
      if(!latest) console.log("There is no current queue number, default 0 will be applied")

      const nextNumber = (latest?.queueNumber ?? 0) + 1
      return nextNumber
    })
    
  } catch (error) {
    console.error("Error in generating Queue Number: ", error)
  }

}

 /// TESTING
// Test with realistic concurrency (10 concurrent requests)
async function testConcurrentQueueNumbers() {
  const testRequests = 10; // Simulate 10 concurrent requests
  
  const promises = [];
  for (let i = 0; i < testRequests; i++) {
    if (i % 2 === 0) {
      promises.push(generateQueueNumber("Regular"));
    } else {
      promises.push(generateQueueNumber("Priority"));
    }
  }
  
  try {
    const results = await Promise.all(promises);
    console.log("Generated queue numbers:", results);
    
    // Verify no duplicates per queue type
    const regularNumbers = results.filter((_, index) => index % 2 === 0);
    const priorityNumbers = results.filter((_, index) => index % 2 === 1);
    
    console.log("Regular numbers (should be unique):", regularNumbers);
    console.log("Priority numbers (should be unique):", priorityNumbers);
    
    const hasRegularDuplicates = new Set(regularNumbers).size !== regularNumbers.length;
    const hasPriorityDuplicates = new Set(priorityNumbers).size !== priorityNumbers.length;
    
    console.log("Regular has duplicates:", hasRegularDuplicates);
    console.log("Priority has duplicates:", hasPriorityDuplicates);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testConcurrentQueueNumbers();