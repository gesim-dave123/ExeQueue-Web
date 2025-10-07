import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import generateReferenceNumber from '../services/queue/generateReferenceNumber.js';
import { formatQueueNumber } from '../services/queue/QueueNumber.js';

// export const generateQueue = async (req, res) => {
//   try {
//     const {
//       fullName,
//       studentId,
//       courseId,
//       courseCode,
//       yearLevel,
//       queueType,
//       serviceRequests, // Should be an array of requests
//     } = req.body;

//     if (
//       !fullName?.trim() ||
//       !studentId?.trim() ||
//       !courseCode?.trim() ||
//       !yearLevel?.trim() ||
//       !queueType?.trim()
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Missing required fields' });
//     }

//     // Check student id format (8 digits)
//     const regexId = /^\d{8}$/;
//     if (!regexId.test(studentId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid student id' });
//     }

//     if (!['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'].includes(yearLevel)) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid year level' });
//     }

//     const course = await prisma.course.findFirst({
//       where: {
//         courseCode: {
//           equals: courseCode,
//           mode: 'insensitive',
//         },
//         courseId: courseId,
//         isActive: true,
//       },
//       select: {
//         courseId: true,
//         courseCode: true,
//         courseName: true,
//         isActive: true
//       }
//     });

//     if (!course || !course.isActive) {
//       return res
//         .status(404)
//         .json({ success: false, message: 'Course not found' });
//     }

//     if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
//       return res.status(403).json({
//         success: false,
//         message: "Service requests are required and must be a non-empty array"
//       });
//     }

//     if (![Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()].includes(queueType.toLowerCase())) {
//       return res.status(403).json({
//         success: false,
//         message: "Invalid Queue Type!"
//       });
//     }

//     const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase()
//       ? Queue_Type.REGULAR
//       : Queue_Type.PRIORITY;

//     return await prisma.$transaction(async(tx) => {
//       // Get start of day in Manila timezone, converted to UTC for database storage
//       const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

//       // // Debug logs to verify timezone handling
//       // const currentManilaTime = DateAndTimeFormatter.nowInTimeZone('Asia/Manila');
//       // const currentUTCTime = new Date();

//       // console.log('=== TIMEZONE DEBUG LOGS ===');
//       // console.log('Current UTC Time:', currentUTCTime.toISOString());
//       // console.log('Current Manila Time:', DateAndTimeFormatter.formatInTimeZone(currentManilaTime, 'yyyy-MM-dd HH:mm:ss zzz', 'Asia/Manila'));
//       // console.log('Manila Date Only:', DateAndTimeFormatter.formatInTimeZone(currentManilaTime, 'yyyy-MM-dd', 'Asia/Manila'));
//       // console.log('Today UTC (start of Manila day):', todayUTC.toISOString());
//       // console.log('Today UTC formatted as Manila:', DateAndTimeFormatter.formatInTimeZone(todayUTC, 'yyyy-MM-dd HH:mm:ss zzz', 'Asia/Manila'));
//       // console.log('=== END DEBUG LOGS ===');

//       let session = await tx.queueSession.findFirst({
//         where: {
//           sessionDate: todayUTC,
//           isActive: true,
//         },
//         orderBy: {
//           sessionId: 'desc'
//         },
//         select: {
//           sessionId: true,
//           sessionNumber: true,
//           maxQueueNo: true
//         }
//       });

//       if (!session) {
//         // Reset sequences when creating a new session
//         await tx.queueSession.updateMany({
//           where: { isActive: true },
//           data:{ isActive:false}
//         })

//         await tx.$executeRaw`ALTER SEQUENCE queue_priority_seq RESTART WITH 1`;
//         await tx.$executeRaw`ALTER SEQUENCE queue_regular_seq RESTART WITH 1`;

//         session = await tx.queueSession.create({
//           data: {
//             sessionNumber: 1,
//             sessionDate: todayUTC,
//             maxQueueNo: 500,
//           },
//           select: {
//             sessionId: true,
//             sessionNumber: true,
//             maxQueueNo: true
//           }
//         });
//       }

//       const sessionId = session.sessionId;
//       const sessionNo = session.sessionNumber;

//       // Determine sequence name (global)
//       const sequenceName =
//         QUEUETYPE === Queue_Type.PRIORITY ? 'queue_priority_seq' : 'queue_regular_seq';

//       // Get next global sequence number
//       const nextSeqResult = await tx.$queryRaw`
//         SELECT nextval(${sequenceName}) as next_seq
//       `;
//       const sequenceNumber = Number(nextSeqResult[0].next_seq); // never resets
//       const queueNumber = ((sequenceNumber - 1) % session.maxQueueNo) + 1; // resets per session

//       // Create queue entry
//       const newQueue = await tx.queue.create({
//         data: {
//           studentId : studentId,
//           studentFullName: fullName,
//           courseCode: course.courseCode,
//           courseName: course.courseName,
//           yearLevel: yearLevel,
//           session: { connect: { sessionId: sessionId } },
//           queueNumber: queueNumber,
//           sequenceNumber: sequenceNumber,
//           queueType: QUEUETYPE,
//           // queueDate: todayUTC,
//           referenceNumber: generateReferenceNumber(todayUTC, QUEUETYPE, sequenceNumber, session.sessionNumber),
//         },
//       });

//       const formattedQueueNumber = formatQueueNumber(QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R', newQueue.queueNumber);
//       const reqTypeIds = serviceRequests.map(r => r.requestTypeId);
//       const existingRequestData = await tx.requestType.findMany({
//         where: { requestTypeId: { in: reqTypeIds } },
//         select: { requestTypeId: true }
//       });

//       const existingIds = existingRequestData.map(r => r.requestTypeId);
//       const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));

//       if (invalidIds.length > 0) {
//         throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
//       }

//       const requests = await Promise.all(
//         reqTypeIds.map(id =>
//           tx.request.create({
//             data: {
//               queue: { connect: { queueId: newQueue.queueId } },
//               requestType: {connect: { requestTypeId: id }},
//               // processedBy: null,
//               // requestStatus: WAITING,
//               processedAt: null,
//               isActive: true
//             }
//           })
//         )
//       );
//         // const requests = [];
//         // for (const id of reqTypeIds) {
//         //   const req = await tx.request.create({
//         //     data: {
//         //       queue: { connect: { queueId: newQueue.queueId } },
//         //       requestType: { connect: { requestTypeId: id } },
//         //       processedAt: null,
//         //       isActive: true
//         //     }
//         //   });
//         //   requests.push(req);
//         // }
//       if (!requests) {
//         return res.status(500).json({
//           success: false,
//           message: "Failed to generate requests"
//         });
//       }

//       return res.status(201).json({
//         success: true,
//         message: "Queue Generated Successfully!",
//         data: { queueDetails: newQueue, queueNumber: formattedQueueNumber, serviceRequests: requests }
//       });
//     });

//   } catch (error) {
//     console.error("Error generating queue:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: 'Internal Server Error' });
//   }
// };

// export const generateQueue = async (req, res) => {
//   try {
//     const {
//       fullName,
//       studentId,
//       courseId,
//       courseCode,
//       yearLevel,
//       queueType,
//       serviceRequests,
//     } = req.body;

//     // -------------------------------
//     // 1. Input Validation
//     // -------------------------------
//     if (
//       !fullName?.trim() ||
//       !studentId?.trim() ||
//       !courseCode?.trim() ||
//       !yearLevel?.trim() ||
//       !queueType?.trim()
//     ) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     if (!/^\d{8}$/.test(studentId)) {
//       return res.status(400).json({ success: false, message: 'Invalid student id' });
//     }

//     if (!['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'].includes(yearLevel)) {
//       return res.status(400).json({ success: false, message: 'Invalid year level' });
//     }

//     if (!['REGULAR', 'PRIORITY'].includes(queueType.toUpperCase())) {
//       return res.status(400).json({ success: false, message: 'Invalid queue type' });
//     }

//     if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
//       return res.status(400).json({ success: false, message: 'Service requests are required' });
//     }

//     const QUEUETYPE = queueType.toUpperCase() === 'PRIORITY' ? 'PRIORITY' : 'REGULAR';

//     // -------------------------------
//     // 2. Start Transaction
//     // -------------------------------
//     const result = await prisma.$transaction(async (tx) => {
//       const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

//       // -------------------------------
//       // 3. Fetch or create today's session
//       // -------------------------------
//       let session = await tx.queueSession.findFirst({
//         where: { sessionDate: todayUTC, isActive: true },
//         orderBy: { sessionId: 'desc' },
//       });

//       if (!session) {
//         // Deactivate old sessions
//         await tx.queueSession.updateMany({ where: { isActive: true }, data: { isActive: false } });

//         // Reset both sequences
//         await tx.$executeRaw`ALTER SEQUENCE queue_regular_seq RESTART WITH 1`;
//         await tx.$executeRaw`ALTER SEQUENCE queue_priority_seq RESTART WITH 1`;

//         // Create new session
//         session = await tx.queueSession.create({
//           data: { sessionDate: todayUTC, sessionNumber: 1, maxQueueNo: 500 },
//         });
//       }

//       // -------------------------------
//       // 4. Auto-reset if queue type hits max
//       // -------------------------------
//       const sequenceName = QUEUETYPE === 'PRIORITY' ? 'queue_priority_seq' : 'queue_regular_seq';

//       const currentCountRaw = await tx.queue.aggregate({
//         _count: { queueId: true },
//         where: { sessionId: session.sessionId, queueType: QUEUETYPE },
//       });
//       const currentCount = currentCountRaw._count.queueId;

//       if (currentCount >= session.maxQueueNo) {
//         await tx.$executeRaw`ALTER SEQUENCE ${sequenceName} RESTART WITH 1`;
//       }

//       // -------------------------------
//       // 5. Get next sequence number
//       // -------------------------------
//       // Get next sequence number atomically
//       const nextSeqResult = await tx.$queryRawUnsafe(
//         `SELECT nextval('${sequenceName}') AS next_seq`
//       );

//       const sequenceNumber = Number(nextSeqResult[0].next_seq);
//       const queueNumber = ((sequenceNumber - 1) % session.maxQueueNo) + 1;

//       // -------------------------------
//       // 6. Create Queue Entry
//       // -------------------------------
//       const course = await tx.course.findFirst({
//         where: { courseId, courseCode: { equals: courseCode, mode: 'insensitive' }, isActive: true },
//         select: { courseId: true, courseCode: true, courseName: true },
//       });

//       if (!course) throw new Error('Course not found');

//       const newQueue = await tx.queue.create({
//         data: {
//           studentId,
//           studentFullName: fullName,
//           courseCode: course.courseCode,
//           courseName: course.courseName,
//           yearLevel,
//           session: { connect: { sessionId: session.sessionId } },
//           queueNumber,
//           sequenceNumber,
//           queueType: QUEUETYPE,
//           referenceNumber: generateReferenceNumber(todayUTC, QUEUETYPE, sequenceNumber, session.sessionNumber),
//         },
//       });

//       // -------------------------------
//       // 7. Validate Request Types & Create Requests
//       // -------------------------------
//       const reqTypeIds = serviceRequests.map((r) => r.requestTypeId);
//       const existingRequestData = await tx.requestType.findMany({
//         where: { requestTypeId: { in: reqTypeIds }, isActive: true },
//         select: { requestTypeId: true },
//       });

//       const existingIds = existingRequestData.map((r) => r.requestTypeId);
//       const invalidIds = reqTypeIds.filter((id) => !existingIds.includes(id));
//       if (invalidIds.length > 0) throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);

//       const requests = await Promise.all(
//         reqTypeIds.map((id) =>
//           tx.request.create({
//             data: {
//               queue: { connect: { queueId: newQueue.queueId } },
//               requestType: { connect: { requestTypeId: id } },
//               processedAt: null,
//               isActive: true,
//             },
//           }),
//         ),
//       );

//       const formattedQueueNumber = formatQueueNumber(QUEUETYPE === 'PRIORITY' ? 'P' : 'R', newQueue.queueNumber);

//       return { newQueue, formattedQueueNumber, requests };
//     });

//     // -------------------------------
//     // 8. Response
//     // -------------------------------
//     return res.status(201).json({
//       success: true,
//       message: 'Queue Generated Successfully!',
//       data: {
//         queueDetails: result.newQueue,
//         queueNumber: result.formattedQueueNumber,
//         serviceRequests: result.requests,
//       },
//     });
//   } catch (error) {
//     console.error('Error generating queue:', error);
//     return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
//   }
// };

// export const generateQueue = async (req, res) => {
//   try {
//     const { fullName, studentId, courseId, courseCode, yearLevel, queueType, serviceRequests } = req.body;

//     // -------------------------------
//     // 1. Input Validation
//     // -------------------------------
//     if (!fullName?.trim() || !studentId?.trim() || !courseCode?.trim() || !yearLevel?.trim() || !queueType?.trim()) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     if (!/^\d{8}$/.test(studentId)) {
//       return res.status(400).json({ success: false, message: 'Invalid student id' });
//     }

//     if (!['1st','2nd','3rd','4th','5th','6th','Irregular'].includes(yearLevel)) {
//       return res.status(400).json({ success: false, message: 'Invalid year level' });
//     }

//     const QUEUETYPE = queueType.toUpperCase() === 'PRIORITY' ? 'PRIORITY' : 'REGULAR';

//     if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
//       return res.status(400).json({ success: false, message: 'Service requests are required' });
//     }

//     // -------------------------------
//     // 2. Start Transaction
//     // -------------------------------
//     const result = await prisma.$transaction(async (tx) => {

//       // Manila start of day UTC
//       const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

//       // -------------------------------
//       // 3. Find or Create Today's Session
//       // -------------------------------
//       let session = await tx.queueSession.findFirst({
//         where: { sessionDate: todayUTC, isActive: true },
//         orderBy: { sessionId: 'desc' },
//       });

//       if (!session) {
//         // Deactivate old sessions
//         await tx.queueSession.updateMany({ where: { isActive: true }, data: { isActive: false } });

//         // Reset sequences at start of new session
//         await tx.$executeRawUnsafe(`ALTER SEQUENCE queue_regular_seq RESTART WITH 1`);
//         await tx.$executeRawUnsafe(`ALTER SEQUENCE queue_priority_seq RESTART WITH 1`);

//         // Create new session
//         session = await tx.queueSession.create({
//           data: { sessionDate: todayUTC, sessionNumber: 1, maxQueueNo: 500 },
//         });
//       }

//       // -------------------------------
//       // 4. Auto-reset per queue type if maxQueueNo reached
//       // -------------------------------
//       const countRaw = await tx.queue.aggregate({
//         _count: { queueId: true },
//         where: { sessionId: session.sessionId, queueType: QUEUETYPE },
//       });
//       const currentCount = countRaw._count.queueId;

//       if (currentCount >= session.maxQueueNo) {
//         const seqName = QUEUETYPE === 'PRIORITY' ? 'queue_priority_seq' : 'queue_regular_seq';
//         await tx.$executeRawUnsafe(`ALTER SEQUENCE ${seqName} RESTART WITH 1`);
//       }

//       // -------------------------------
//       // 5. Get next sequence number atomically
//       // -------------------------------
//       const sequenceName = QUEUETYPE === 'PRIORITY' ? 'queue_priority_seq' : 'queue_regular_seq';
//       const nextSeqResult = await tx.$queryRawUnsafe(`SELECT nextval('${sequenceName}') AS next_seq`);
//       const sequenceNumber = Number(nextSeqResult[0].next_seq);
//       const queueNumber = ((sequenceNumber - 1) % session.maxQueueNo) + 1;

//       // -------------------------------
//       // 6. Find Course
//       // -------------------------------
//       const course = await tx.course.findFirst({
//         where: { courseId, courseCode: { equals: courseCode, mode: 'insensitive' }, isActive: true },
//         select: { courseId: true, courseCode: true, courseName: true },
//       });
//       if (!course) throw new Error('Course not found');

//       // -------------------------------
//       // 7. Create Queue
//       // -------------------------------
//       const newQueue = await tx.queue.create({
//         data: {
//           studentId,
//           studentFullName: fullName,
//           courseCode: course.courseCode,
//           courseName: course.courseName,
//           yearLevel,
//           session: { connect: { sessionId: session.sessionId } },
//           queueNumber,
//           sequenceNumber,
//           queueType: QUEUETYPE,
//           referenceNumber: generateReferenceNumber(todayUTC, QUEUETYPE, sequenceNumber, session.sessionNumber),
//         },
//       });

//       // -------------------------------
//       // 8. Validate Service Requests
//       // -------------------------------
//       const reqTypeIds = serviceRequests.map(r => r.requestTypeId);
//       const existingRequestData = await tx.requestType.findMany({
//         where: { requestTypeId: { in: reqTypeIds }, isActive: true },
//         select: { requestTypeId: true },
//       });
//       const existingIds = existingRequestData.map(r => r.requestTypeId);
//       const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));
//       if (invalidIds.length > 0) throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);

//       // -------------------------------
//       // 9. Create Requests
//       // -------------------------------
//       const requests = await Promise.all(
//         reqTypeIds.map(id =>
//           tx.request.create({
//             data: {
//               queue: { connect: { queueId: newQueue.queueId } },
//               requestType: { connect: { requestTypeId: id } },
//               processedAt: null,
//               isActive: true,
//             },
//           }),
//         ),
//       );

//       const formattedQueueNumber = formatQueueNumber(QUEUETYPE === 'PRIORITY' ? 'P' : 'R', newQueue.queueNumber);

//       return { newQueue, formattedQueueNumber, requests };
//     });

//     // -------------------------------
//     // 10. Return Response
//     // -------------------------------
//     return res.status(201).json({
//       success: true,
//       message: 'Queue Generated Successfully!',
//       data: {
//         queueDetails: result.newQueue,
//         queueNumber: result.formattedQueueNumber,
//         serviceRequests: result.requests,
//       },
//     });
//   } catch (error) {
//     console.error('Error generating queue:', error);
//     return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
//   }
// };

// export const generateQueue = async (req, res) => {
//   try {
//     const {
//       fullName,
//       studentId,
//       courseId,
//       courseCode,
//       yearLevel,
//       queueType,
//       serviceRequests,
//     } = req.body;

//     // Validation code remains the same...
//     if (
//       !fullName?.trim() ||
//       !studentId?.trim() ||
//       !courseCode?.trim() ||
//       !yearLevel?.trim() ||
//       !queueType?.trim()
//     ) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     const regexId = /^\d{8}$/;
//     if (!regexId.test(studentId)) {
//       return res.status(400).json({ success: false, message: 'Invalid student id' });
//     }

//     if (!['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'].includes(yearLevel)) {
//       return res.status(400).json({ success: false, message: 'Invalid year level' });
//     }

//     const course = await prisma.course.findFirst({
//       where: {
//         courseCode: { equals: courseCode, mode: 'insensitive' },
//         courseId: courseId,
//         isActive: true,
//       },
//       select: { courseId: true, courseCode: true, courseName: true, isActive: true }
//     });

//     if (!course || !course.isActive) {
//       return res.status(404).json({ success: false, message: 'Course not found' });
//     }

//     if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
//       return res.status(403).json({
//         success: false,
//         message: "Service requests are required and must be a non-empty array"
//       });
//     }

//     if (![Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()].includes(queueType.toLowerCase())) {
//       return res.status(403).json({
//         success: false,
//         message: "Invalid Queue Type!"
//       });
//     }

//     const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase()
//       ? Queue_Type.REGULAR
//       : Queue_Type.PRIORITY;

//     return await prisma.$transaction(async (tx) => {
//       const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

//       // 🔥 ATOMIC SESSION MANAGEMENT - Use upsert to handle race conditions
//       const session = await tx.queueSession.upsert({
//         where: {
//           sessionDate_isActive: {
//             sessionDate: todayUTC,
//             isActive: true
//           }
//         },
//         update: {}, // No updates if exists
//         create: {
//           sessionNumber: 1,
//           sessionDate: todayUTC,
//           maxQueueNo: 500,
//           isActive: true
//         },
//         select: {
//           sessionId: true,
//           sessionNumber: true,
//           maxQueueNo: true
//         }
//       });

//       const sessionId = session.sessionId;

//       // ✅ SEQUENCES ARE ATOMIC - This part is fine
//       const sequenceName = QUEUETYPE === Queue_Type.PRIORITY ? 'queue_priority_seq' : 'queue_regular_seq';
//       const nextSeqResult = await tx.$queryRaw`
//         SELECT nextval(${sequenceName}) as next_seq
//       `;
//       const sequenceNumber = Number(nextSeqResult[0].next_seq);
//       const queueNumber = ((sequenceNumber - 1) % session.maxQueueNo) + 1;

//       // Create queue entry
//       const newQueue = await tx.queue.create({
//         data: {
//           studentId: studentId,
//           studentFullName: fullName,
//           courseCode: course.courseCode,
//           courseName: course.courseName,
//           yearLevel: yearLevel,
//           session: { connect: { sessionId: sessionId } },
//           queueNumber: queueNumber,
//           sequenceNumber: sequenceNumber,
//           queueType: QUEUETYPE,
//           referenceNumber: generateReferenceNumber(todayUTC, QUEUETYPE, sequenceNumber, session.sessionNumber),
//         },
//       });

//       const formattedQueueNumber = formatQueueNumber(QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R', newQueue.queueNumber);

//       const reqTypeIds = serviceRequests.map(r => r.requestTypeId);
//       const existingRequestData = await tx.requestType.findMany({
//         where: { requestTypeId: { in: reqTypeIds } },
//         select: { requestTypeId: true }
//       });

//       const existingIds = existingRequestData.map(r => r.requestTypeId);
//       const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));

//       if (invalidIds.length > 0) {
//         throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
//       }

//       const requests = await Promise.all(
//         reqTypeIds.map(id =>
//           tx.request.create({
//             data: {
//               queue: { connect: { queueId: newQueue.queueId } },
//               requestType: { connect: { requestTypeId: id } },
//               processedAt: null,
//               isActive: true
//             }
//           })
//         )
//       );

//       return res.status(201).json({
//         success: true,
//         message: "Queue Generated Successfully!",
//         data: {
//           queueDetails: newQueue,
//           queueNumber: formattedQueueNumber,
//           serviceRequests: requests
//         }
//       });
//     });

//   } catch (error) {
//     console.error("Error generating queue:", error);

//     // Handle unique constraint violations gracefully
//     if (error.code === 'P2002') {
//       return res.status(409).json({
//         success: false,
//         message: "Queue generation conflict, please try again"
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Internal Server Error'
//     });
//   }
// };

// import { Prisma } from '@prisma/client';

/**
 * Generate Queue with Automatic Reset Functionality
 *
 * Features:
 * - Atomic queue number generation using PostgreSQL sequences
 * - Automatic session reset when hitting 500 queue limit
 * - Multiple sessions per day support
 * - Old queues remain servable after reset
 * - Handles 10+ concurrent requests safely
 * - No race conditions with advisory locks
 */
// export const generateQueue = async (req, res) => {
//   try {
//     const {
//       fullName,
//       studentId,
//       courseId,
//       courseCode,
//       yearLevel,
//       queueType,
//       serviceRequests,
//     } = req.body;

//     // =================== VALIDATION ===================

//     if (
//       !fullName?.trim() ||
//       !studentId?.trim() ||
//       !courseCode?.trim() ||
//       !yearLevel?.trim() ||
//       !queueType?.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields'
//       });
//     }

//     // Validate student ID format (8 digits)
//     const regexId = /^\d{8}$/;
//     if (!regexId.test(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid student id format. Must be 8 digits.'
//       });
//     }

//     // Validate year level
//     const validYearLevels = ['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'];
//     if (!validYearLevels.includes(yearLevel)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid year level'
//       });
//     }

//     // Validate course exists
//     const course = await prisma.course.findFirst({
//       where: {
//         courseCode: { equals: courseCode, mode: 'insensitive' },
//         courseId: courseId,
//         isActive: true,
//       },
//       select: {
//         courseId: true,
//         courseCode: true,
//         courseName: true,
//         isActive: true
//       }
//     });

//     if (!course || !course.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found or inactive'
//       });
//     }

//     // Validate service requests
//     if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Service requests are required and must be a non-empty array"
//       });
//     }

//     // Validate queue type
//     const validQueueTypes = [Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()];
//     if (!validQueueTypes.includes(queueType.toLowerCase())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Queue Type! Must be REGULAR or PRIORITY"
//       });
//     }

//     const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase()
//       ? Queue_Type.REGULAR
//       : Queue_Type.PRIORITY;

//     // =================== TRANSACTION ===================

//     return await prisma.$transaction(async (tx) => {
//       const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

//       // 🔒 CRITICAL: Advisory lock prevents concurrent session creation race conditions
//       // This ensures only ONE transaction can check/create sessions at a time
//       await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('queue_session_lock'))`;

//       // =================== SESSION MANAGEMENT ===================

//       // Find active session for today that's accepting new queues
//       let session = await tx.queueSession.findFirst({
//         where: {
//           sessionDate: todayUTC,
//           isActive: true,
//           isAcceptingNew: true
//         },
//         select: {
//           sessionId: true,
//           sessionNumber: true,
//           maxQueueNo: true,
//           currentQueueCount: true
//         }
//       });

//       // Check if we need to create a new session
//       let shouldCreateNewSession = false;
//       let nextSessionNumber = 1;

//       if (session) {
//         // Check if current session hit the limit
//         if (session.currentQueueCount >= session.maxQueueNo) {
//           shouldCreateNewSession = true;
//           nextSessionNumber = session.sessionNumber + 1;

//           // Close current session (no longer accepting, but still serving)
//           await tx.queueSession.update({
//             where: { sessionId: session.sessionId },
//             data: {
//               isAcceptingNew: false,
//               // isServing stays true - old queues still servable
//             }
//           });
//         }
//       } else {
//         // No active session found - create first session of the day
//         shouldCreateNewSession = true;
//         nextSessionNumber = 1;
//       }

//       // Create new session if needed
//       if (shouldCreateNewSession) {
//         // Reset sequences for new session
//         await tx.$executeRaw`ALTER SEQUENCE queue_priority_seq RESTART WITH 1`;
//         await tx.$executeRaw`ALTER SEQUENCE queue_regular_seq RESTART WITH 1`;

//         session = await tx.queueSession.create({
//           data: {
//             sessionDate: todayUTC,
//             sessionNumber: nextSessionNumber,
//             maxQueueNo: 500,
//             currentQueueCount: 0,
//             isAcceptingNew: true,
//             isServing: true,
//             isActive: true
//           },
//           select: {
//             sessionId: true,
//             sessionNumber: true,
//             maxQueueNo: true,
//             currentQueueCount: true
//           }
//         });

//         console.log(`🔄 New session created: Session ${nextSessionNumber} for ${todayUTC.toISOString()}`);
//       }

//       // =================== QUEUE NUMBER GENERATION ===================

//       // Get next sequence number (atomic operation, no race condition)
//       const sequenceName = QUEUETYPE === Queue_Type.PRIORITY
//         ? 'queue_priority_seq'
//         : 'queue_regular_seq';

//       const nextSeqResult = await tx.$queryRaw`
//         SELECT nextval(${sequenceName}) as next_seq
//       `;
//       const sequenceNumber = Number(nextSeqResult[0].next_seq);

//       // Calculate display queue number with wrapping (1-500)
//       const queueNumber = ((sequenceNumber - 1) % session.maxQueueNo) + 1;

//       // Track which reset iteration this queue belongs to
//       // Iteration 0: sequences 1-500
//       // Iteration 1: sequences 501-1000 (displays as 1-500)
//       // Iteration 2: sequences 1001-1500 (displays as 1-500)
//       const resetIteration = Math.floor((sequenceNumber - 1) / session.maxQueueNo);

//       // Generate reference number
//       const refNumber = generateReferenceNumber(
//         todayUTC,
//         QUEUETYPE,
//         sequenceNumber,
//         session.sessionNumber
//       );

//       // =================== CREATE QUEUE ===================

//       const newQueue = await tx.queue.create({
//         data: {
//           sessionId: session.sessionId,
//           studentId: studentId,
//           studentFullName: fullName,
//           courseCode: course.courseCode,
//           courseName: course.courseName,
//           yearLevel: yearLevel,
//           queueNumber: queueNumber,
//           sequenceNumber: sequenceNumber,
//           resetIteration: resetIteration,
//           queueType: QUEUETYPE,
//           queueStatus: 'WAITING',
//           referenceNumber: refNumber,
//           isActive: true
//         }
//       });

//       // Increment session queue count
//       await tx.queueSession.update({
//         where: { sessionId: session.sessionId },
//         data: { currentQueueCount: { increment: 1 } }
//       });

//       // =================== CREATE SERVICE REQUESTS ===================

//       const reqTypeIds = serviceRequests.map(r => r.requestTypeId);

//       // Validate all request types exist
//       const existingRequestData = await tx.requestType.findMany({
//         where: { requestTypeId: { in: reqTypeIds } },
//         select: { requestTypeId: true }
//       });

//       const existingIds = existingRequestData.map(r => r.requestTypeId);
//       const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));

//       if (invalidIds.length > 0) {
//         throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
//       }

//       // Create all requests
//       const requests = await Promise.all(
//         reqTypeIds.map(id =>
//           tx.request.create({
//             data: {
//               queueId: newQueue.queueId,
//               requestTypeId: id,
//               requestStatus: 'WAITING',
//               isActive: true
//             },
//             include: {
//               requestType: {
//                 select: {
//                   requestTypeId: true,
//                   requestName: true
//                 }
//               }
//             }
//           })
//         )
//       );

//       // =================== FORMAT RESPONSE ===================

//       const formattedQueueNumber = formatQueueNumber(
//         QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R',
//         newQueue.queueNumber
//       );

//       console.log(`✅ Queue generated: ${formattedQueueNumber} (Seq: ${sequenceNumber}, Session: ${session.sessionNumber}, Iteration: ${resetIteration})`);

//       return res.status(201).json({
//         success: true,
//         message: "Queue Generated Successfully!",
//         data: {
//           queueDetails: {
//             queueId: newQueue.queueId,
//             queueNumber: newQueue.queueNumber,
//             formattedQueueNumber: formattedQueueNumber,
//             sequenceNumber: newQueue.sequenceNumber,
//             resetIteration: newQueue.resetIteration,
//             queueType: newQueue.queueType,
//             queueStatus: newQueue.queueStatus,
//             referenceNumber: newQueue.referenceNumber,
//             studentId: newQueue.studentId,
//             studentFullName: newQueue.studentFullName,
//             courseCode: newQueue.courseCode,
//             courseName: newQueue.courseName,
//             yearLevel: newQueue.yearLevel
//           },
//           sessionInfo: {
//             sessionId: session.sessionId,
//             sessionNumber: session.sessionNumber,
//             currentCount: session.currentQueueCount + 1,
//             maxQueueNo: session.maxQueueNo
//           },
//           serviceRequests: requests.map(req => ({
//             requestId: req.requestId,
//             requestTypeId: req.requestTypeId,
//             requestName: req.requestType.requestName,
//             requestStatus: req.requestStatus
//           }))
//         }
//       });
//     }, {
//       maxWait: 5000, // Wait up to 5s for a transaction slot
//       timeout: 10000, // Transaction must complete within 10s
//     });

//   } catch (error) {
//     console.error("Error generating queue:", error);

//     // Handle specific errors
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       if (error.code === 'P2002') {
//         return res.status(409).json({
//           success: false,
//           message: "Queue generation conflict. Please try again."
//         });
//       }
//     }

//     if (error.message?.includes('Request Types Not Found')) {
//       return res.status(400).json({
//         success: false,
//         message: error.message
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Internal Server Error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

export const generateQueue = async (req, res) => {
  try {
    const {
      fullName,
      studentId,
      courseId,
      courseCode,
      yearLevel,
      queueType,
      serviceRequests,
    } = req.body;

    // =================== VALIDATION ===================
    if (
      !fullName?.trim() ||
      !studentId?.trim() ||
      !courseCode?.trim() ||
      !yearLevel?.trim() ||
      !queueType?.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // Student ID format (8 digits)
    const regexId = /^\d{8}$/;
    if (!regexId.test(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student id format. Must be 8 digits.',
      });
    }

    const validYearLevels = [
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      'Irregular',
    ];
    if (!validYearLevels.includes(yearLevel)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid year level' });
    }

    // Course validation
    const course = await prisma.course.findFirst({
      where: {
        courseId,
        courseCode: { equals: courseCode, mode: 'insensitive' },
        isActive: true,
      },
      select: { courseId: true, courseCode: true, courseName: true },
    });

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found or inactive' });

    // Validate service requests
    if (!serviceRequests?.length)
      return res
        .status(400)
        .json({ success: false, message: 'Service requests are required' });

    const validQueueTypes = [
      Queue_Type.REGULAR.toLowerCase(),
      Queue_Type.PRIORITY.toLowerCase(),
    ];
    if (!validQueueTypes.includes(queueType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Queue Type! Must be REGULAR or PRIORITY',
      });
    }

    const QUEUETYPE =
      queueType.toUpperCase() === Queue_Type.REGULAR
        ? Queue_Type.REGULAR
        : Queue_Type.PRIORITY;

    // =================== TRANSACTION ===================
    return await prisma.$transaction(
      async (tx) => {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          'Asia/Manila'
        );

        // Advisory lock to prevent session race conditions
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('queue_session_lock'))`;

        // Find or create today's active session
        let session = await tx.queueSession.findFirst({
          where: { sessionDate: todayUTC, isActive: true },
          orderBy: { sessionNumber: 'desc' },
        });

        if (!session) {
          const lastSession = await tx.queueSession.findFirst({
            where: { sessionDate: todayUTC },
            orderBy: { sessionNumber: 'desc' },
          });

          const nextSessionNumber = lastSession
            ? lastSession.sessionNumber + 1
            : 1;
          session = await tx.queueSession.create({
            data: {
              sessionDate: todayUTC,
              sessionNumber: nextSessionNumber,
              maxQueueNo: 500,
              currentQueueCount: 0,
              regularCount: 0,
              priorityCount: 0,
              isAcceptingNew: true,
              isServing: true,
              isActive: true,
            },
          });
        }

        // =================== QUEUE NUMBER & AUTO-WRAP ===================
        const counterField =
          QUEUETYPE === Queue_Type.REGULAR ? 'regularCount' : 'priorityCount';

        const updatedSession = await tx.queueSession.update({
          where: { sessionId: session.sessionId },
          data: { [counterField]: { increment: 1 } },
          select: { regularCount: true, priorityCount: true, maxQueueNo: true },
        });

        const currentCount =
          QUEUETYPE === Queue_Type.REGULAR
            ? updatedSession.regularCount
            : updatedSession.priorityCount;
        const queueNumber =
          ((currentCount - 1) % updatedSession.maxQueueNo) + 1;
        const resetIteration = Math.floor(
          (currentCount - 1) / updatedSession.maxQueueNo
        );

        // =================== CREATE QUEUE ===================
        const refNumber = generateReferenceNumber(
          todayUTC,
          QUEUETYPE,
          currentCount,
          session.sessionNumber
        );

        const newQueue = await tx.queue.create({
          data: {
            sessionId: session.sessionId,
            studentId,
            studentFullName: fullName,
            courseCode: course.courseCode,
            courseName: course.courseName,
            yearLevel,
            queueNumber,
            sequenceNumber: currentCount, // atomic unique
            resetIteration,
            queueType: QUEUETYPE,
            queueStatus: 'WAITING',
            referenceNumber: refNumber,
            isActive: true,
          },
        });
        console.log(
          `✅ Queue generated: ${formatQueueNumber(
            QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R',
            queueNumber
          )} (Seq: ${currentCount}, Session: ${
            session.sessionNumber
          }, Iteration: ${resetIteration})`
        );
        // Increment total session count
        await tx.queueSession.update({
          where: { sessionId: session.sessionId },
          data: { currentQueueCount: { increment: 1 } },
        });

        // =================== CREATE SERVICE REQUESTS ===================
        const reqTypeIds = serviceRequests.map((r) => r.requestTypeId);
        const existingRequestData = await tx.requestType.findMany({
          where: { requestTypeId: { in: reqTypeIds } },
        });
        const existingIds = existingRequestData.map((r) => r.requestTypeId);
        const invalidIds = reqTypeIds.filter((id) => !existingIds.includes(id));
        if (invalidIds.length > 0)
          throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);

        const requests = await Promise.all(
          reqTypeIds.map((id) =>
            tx.request.create({
              data: {
                queueId: newQueue.queueId,
                requestTypeId: id,
                requestStatus: 'WAITING',
                isActive: true,
              },
              include: {
                requestType: {
                  select: { requestTypeId: true, requestName: true },
                },
              },
            })
          )
        );

        // =================== FORMAT RESPONSE ===================
        const formattedQueueNumber = formatQueueNumber(
          QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R',
          queueNumber
        );

        return res.status(201).json({
          success: true,
          message: 'Queue Generated Successfully!',
          data: {
            queueDetails: {
              queueId: newQueue.queueId,
              queueNumber,
              formattedQueueNumber,
              sequenceNumber: currentCount,
              resetIteration,
              queueType: newQueue.queueType,
              queueStatus: newQueue.queueStatus,
              referenceNumber: newQueue.referenceNumber,
              studentId: newQueue.studentId,
              studentFullName: newQueue.studentFullName,
              courseCode: newQueue.courseCode,
              courseName: newQueue.courseName,
              yearLevel: newQueue.yearLevel,
            },
            sessionInfo: {
              sessionId: session.sessionId,
              sessionNumber: session.sessionNumber,
              currentCount: session.currentQueueCount + 1,
              maxQueueNo: session.maxQueueNo,
            },
            serviceRequests: requests.map((req) => ({
              requestId: req.requestId,
              requestTypeId: req.requestTypeId,
              requestName: req.requestType.requestName,
              requestStatus: req.requestStatus,
            })),
          },
        });
      },
      { maxWait: 5000, timeout: 10000 }
    );
  } catch (error) {
    console.error('Error generating queue:', error);
    if (error.message?.includes('Request Types Not Found')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getQueue = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );
    const { studentId, referenceNumber } = req.query;
    console.log('Student ID:', studentId);
    console.log('Reference Number:', referenceNumber);
    if (!studentId?.trim() || !referenceNumber?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    let whereClause = {
      queueDate: todayUTC,
      isActive: true,
      queueStatus: Status.WAITING,
    };

    if (studentId) {
      whereClause.schoolId = studentId;
    } else if (referenceNumber) {
      whereClause.referenceNumber = referenceNumber;
    }

    const queues = await prisma.queue.findMany({
      where: whereClause,
      orderBy: [{ queueSessionId: 'desc' }, { queueNumber: 'desc' }],
      select: {
        queueId: true,
        studentFullName: true,
        schoolId: true,
        course: {
          select: {
            courseCode: true,
          },
        },
        yearLevel: true,
        queueSessionId: true,
        queueStatus: true,
        queueDate: true,
        referenceNumber: true,
        queueType: true,
        queueNumber: true,
        createdAt: true,
        isActive: true,
        requests: {
          select: {
            requestId: true,
            requestStatus: true,
            requestType: {
              select: {
                requestName: true,
                description: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!queues || queues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No queues found for today',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Queues fetched successfully!',
      queue: queues,
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch queue',
    });
  }
};

export const getQueueStatus = async (req, res) => {
  const { schoolId } = req.params;

  try {
    const studentQueue = await prisma.queue.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
      select: {
        queueId: true,
        queueNumber: true,
        queueStatus: true,
        queueSessionId: true,
        queueType: true,
      },
    });

    if (!studentQueue) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found in queue' });
    }
    const aheadCount = await prisma.queue.count({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueType: studentQueue.queueType,
        isActive: true,
        queueStatus: 'WAITING',
        queueNumber: { lt: studentQueue.queueNumber },
      },
    });
    const response = {
      success: true,
      message: 'Queue status received successfully',
      data: {
        queueNumber: studentQueue.queueNumber,
        position: aheadCount + 1,
        status: studentQueue.queueStatus,
      },
    };
    res.json(response);
  } catch (error) {
    res.stattus(500).json({ message: 'Server error' });
  }
};

//View Queue Page in figma (student)
export const getQueueOverview = async (req, res) => {
  const { schoolId } = req.params;

  try {
    //Your Information
    const studentQueue = await prisma.queue.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
      select: {
        queueId: true,
        queueNumber: true,
        queueStatus: true,
        queueSessionId: true,
        queueType: true,
        studentFullName: true,
        schoolId: true,
        requests: {
          select: {
            requestId: true,
            requestType: {
              select: { requestName: true },
            },
          },
        },
      },
    });

    if (!studentQueue)
      return res
        .status(404)
        .json({ success: false, message: 'Student not found in queue' });
    console.log('Student Queue:', studentQueue);
    //Queue Status
    const currentServing = await prisma.queue.findMany({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'IN_SERVICE',
        isActive: true,
      },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    console.log('Current Serving:', currentServing);
    //Next in Line(window 1 = all regular)
    const window1Next = await prisma.queue.findFirst({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'WAITING',
        isActive: true,
        queueType: 'REGULAR',
        windowId: 1,
      },
      orderBy: { queueNumber: 'asc' },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    //Next in Line (window 2 = prioritize priority queueType)
    let window2Next = await prisma.queue.findFirst({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'WAITING',
        isActive: true,
        queueType: 'PRIORITY',
        windowId: 2,
      },
      orderBy: { queueNumber: 'asc' },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    //If no priority is waiting, go back to regular
    if (!window2Next) {
      window2Next = await prisma.queue.findFirst({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          isActive: true,
          queueType: 'REGULAR',
          windowId: 1,
        },
        orderBy: { queueNumber: 'asc' },
        select: {
          queueNumber: true,
          queueType: true,
          windowId: true,
        },
      });
    }

    //totals for regular & priority
    const [regularCount, priorityCount] = await Promise.all([
      prisma.queue.count({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          queueType: 'REGULAR',
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          queueType: 'PRIORITY',
          isActive: true,
        },
      }),
    ]);

    const aheadCount = await prisma.queue.count({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueType: studentQueue.queueType,
        isActive: true,
        queueStatus: 'WAITING',
        queueNumber: { lt: studentQueue.queueNumber },
      },
    });

    return res.json({
      success: true,
      message: 'Queue overview fetched successfully',
      data: {
        student: {
          fullName: studentQueue.studentFullName,
          studentId: studentQueue.schoolId,
          queueNumber: studentQueue.queueNumber,
          queueType: studentQueue.queueType,
          position: aheadCount + 1,
          status: studentQueue.queueStatus,
          services: studentQueue.requests.map((r) => r.requestType.requestName),
        },
        currentServing,
        window1: window1Next || null,
        window2: window2Next || null,
        totals: {
          regularWaiting: regularCount,
          priorityWaiting: priorityCount,
        },
      },
    });
  } catch (error) {
    console.error('Error in Getting Overview:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

// Get Course Data
export const getCourseData = async (req, res) => {
  try {
    const courseData = await prisma.course.findMany({
      orderBy: {
        courseId: 'asc',
      },
      select: {
        courseId: true,
        courseCode: true,
        courseName: true,
      },
    });

    if (!courseData)
      return res.status(403).json({
        success: false,
        message: 'Error in fetching course data',
      });

    return res.status(200).json({
      success: true,
      message: 'Course data fetched successfully!',
      courseData: courseData,
    });
  } catch (error) {
    console.error('Error in Course Route: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};

// Get Request Types
export const getRequestTypes = async (req, res) => {
  try {
    const requestTypes = await prisma.requestType.findMany({
      orderBy: {
        requestTypeId: 'asc',
      },
      select: {
        requestTypeId: true,
        requestName: true,
      },
    });
    if (!requestTypes)
      return res.status(403).json({
        success: false,
        message: 'An error occurred when fetching request types',
      });

    return res.status(200).json({
      success: true,
      message: 'Successfully fetched reqeust Types',
      requestType: requestTypes,
    });
  } catch (error) {
    console.error('Error in Request ROute: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};
