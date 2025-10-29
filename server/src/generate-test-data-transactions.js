// generate-test-data.js
// Run this script to generate 30 test transactions
// Usage: node generate-test-data.js

import { PrismaClient, Status, Queue_Type } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data
const courses = ['BSIT', 'BSCS', 'BSME', 'BSA', 'BEED', 'BS-Psych'];
const courseNames = {
  'BSIT': 'Bachelor of Science in Information Technology',
  'BSCS': 'Bachelor of Science in Computer Science',
  'BSME': 'Bachelor of Science in Mechanical Engineering',
  'BSA': 'Bachelor of Science in Accountancy',
  'BEED': 'Bachelor of Elementary Education',
  'BS-Psych': 'Bachelor of Science in Psychology'
};

const firstNames = ['John', 'Maria', 'Jose', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa', 'Miguel', 'Sofia'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Ramos', 'Flores', 'Mendoza', 'Torres', 'Gonzales', 'Rivera'];
const statuses = [
  Status.COMPLETED, 
  Status.CANCELLED, 
  Status.DEFERRED, 
  Status.PARTIALLY_COMPLETE,
  Status.STALLED  // ✅ ADDED
];

// Generate random student ID
function generateStudentId() {
  return '2' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
}

// Generate random date in the past 30 days
function randomDate(daysBack = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

// Random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateTestTransactions() {
  try {
    console.log('🚀 Starting test data generation...\n');

    // 1. Get active session or create one
    let session = await prisma.queueSession.findFirst({
      where: { isActive: true },
      orderBy: { sessionNumber: 'desc' }
    });

    if (!session) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      session = await prisma.queueSession.create({
        data: {
          sessionDate: today,
          sessionNumber: 1,
          maxQueueNo: 500,
          isActive: true
        }
      });
      console.log('✅ Created new session:', session.sessionId);
    } else {
      console.log('✅ Using existing session:', session.sessionId);
    }

    // 2. Get all request types
    const requestTypes = await prisma.requestType.findMany({
      where: { isActive: true }
    });

    if (requestTypes.length === 0) {
      console.error('❌ No request types found! Please add request types first.');
      return;
    }
    console.log(`✅ Found ${requestTypes.length} request types\n`);

    // 3. Get a staff member to assign as performer
    const staff = await prisma.sasStaff.findFirst({
      where: { isActive: true }
    });

    if (!staff) {
      console.error('❌ No active staff found!');
      return;
    }
    console.log(`✅ Using staff: ${staff.firstName} ${staff.lastName}\n`);

    // 🆕 4. Find the highest existing sequence numbers for this session
    const [highestRegular, highestPriority] = await Promise.all([
      prisma.queue.findFirst({
        where: {
          sessionId: session.sessionId,
          queueType: Queue_Type.REGULAR
        },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true }
      }),
      prisma.queue.findFirst({
        where: {
          sessionId: session.sessionId,
          queueType: Queue_Type.PRIORITY
        },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true }
      })
    ]);

    // Start from the next available sequence number
    let regularSequence = (highestRegular?.sequenceNumber || 0) + 1;
    let prioritySequence = (highestPriority?.sequenceNumber || 0) + 1;

    console.log(`📊 Starting sequences - REGULAR: ${regularSequence}, PRIORITY: ${prioritySequence}\n`);

    // 5. Generate 30 transactions
    console.log('📝 Generating 30 test transactions...\n');

    for (let i = 0; i < 30; i++) {
      const course = randomItem(courses);
      const studentId = generateStudentId();
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const fullName = `${firstName} ${lastName}`;
      const queueType = Math.random() > 0.7 ? Queue_Type.PRIORITY : Queue_Type.REGULAR;
      const status = randomItem(statuses);
      const createdDate = randomDate(30); // Random date in last 30 days
      
      // Get the correct sequence number based on queue type
      const sequenceNumber = queueType === Queue_Type.PRIORITY ? prioritySequence : regularSequence;
      const queueNumber = sequenceNumber; // For display
      
      // Create queue
      const queue = await prisma.queue.create({
        data: {
          sessionId: session.sessionId,
          studentId: studentId,
          studentFullName: fullName,
          courseCode: course,
          courseName: courseNames[course],
          yearLevel: `${Math.floor(Math.random() * 4) + 1}st`,
          queueNumber: queueNumber,
          sequenceNumber: sequenceNumber,
          queueType: queueType,
          queueStatus: status,
          referenceNumber: `${session.sessionNumber}-${queueType === Queue_Type.PRIORITY ? 'P' : 'R'}-${String(queueNumber).padStart(3, '0')}`,
          createdAt: createdDate,
          isActive: true
        }
      });

      // Increment the appropriate counter
      if (queueType === Queue_Type.PRIORITY) {
        prioritySequence++;
      } else {
        regularSequence++;
      }

      // Create 1-3 requests for this queue
      const numRequests = Math.floor(Math.random() * 3) + 1;
      const selectedRequestTypes = [];
      
      for (let j = 0; j < numRequests; j++) {
        const requestType = randomItem(requestTypes);
        selectedRequestTypes.push(requestType);
        
        await prisma.request.create({
          data: {
            queueId: queue.queueId,
            requestTypeId: requestType.requestTypeId,
            requestStatus: status,
            processedBy: staff.sasStaffId,
            processedAt: status === Status.COMPLETED ? createdDate : null,
            createdAt: createdDate,
            isActive: true
          }
        });
      }

      // Create transaction history
      await prisma.transactionHistory.create({
        data: {
          queueId: queue.queueId,
          requestId: null, // Queue-level transaction
          performedById: staff.sasStaffId,
          performedByRole: staff.role,
          transactionStatus: status,
          createdAt: createdDate
        }
      });

      console.log(`✅ [${i + 1}/30] Created: ${fullName} - ${course} - ${selectedRequestTypes.map(rt => rt.requestName).join(', ')} - ${status} - ${queueType}`);
    }

    console.log('\n🎉 Successfully generated 30 test transactions!');
    
    // Show summary
    const totalTransactions = await prisma.transactionHistory.count();
    console.log(`\n📊 Total transactions in database: ${totalTransactions}`);

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateTestTransactions();