import { Prisma, Queue_Type } from '@prisma/client';
import prisma from '../../prisma/prisma.js';

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
    if (
      !fullName?.trim() ||
      !studentId?.trim() ||
      !courseCode?.trim() ||
      !yearLevel?.trim() ||
      !queueType?.trim()
    )
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });

    //check schol id no special char. and is 8 digits
    const regexId = /^\d{8}$/;
    if (!regexId.test(studentId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid student id' });

    if (!['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'].includes(yearLevel))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid year level' });

    const course = await prisma.course.findFirst({
      where: {
        courseCode: {
          equals: courseCode,
          mode: 'insensitive',
        },
        courseId: courseId,
        isActive: true,
      },
      select :{
        courseId: true,
        isActive: true
      } 
    });
    if (!course || !course.isActive)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });


    if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Student requests are required and must be a non-empty array"
      })
    }

    if (![Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()].includes(queueType.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Invalid Queue Type!"
      })
    }

    const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase() 
    ? Queue_Type.REGULAR
    : Queue_Type.PRIORITY

    return await prisma.$transaction(async(tx)=>{
      const today = new Date()
      today.setHours(0,0,0,0);


      const activeSession  = await tx.queueSession.findFirst({
        where: {
          sessionDate: today,
          isActive: true
        },
        orderBy:{
          sessionId: 'desc'
        },
        select:{
          sessionId: true,
        }
      })
      let session;
      if(activeSession){
        session = activeSession;
      } else {
        session = await tx.queueSession.create({
          data: { sessionNo: 1, sessionDate: today },
        });
      }
      const sessionId = session.sessionId;
      
      let attempt =0
      let maxRetries =3
      let newQueue = null;
      
      while(attempt < maxRetries && !newQueue){
        try {
          const latest = await tx.queue.findFirst({
          where:{
            queueType: QUEUETYPE,
            queueDate: today,
            queueSessionId: sessionId
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
        newQueue = await tx.queue.create({
            data:{
              schoolId: studentId,
              studentFullName: fullName,
              courseId: courseId,
              yearLevel: yearLevel,
              queueNumber: nextNumber,
              queueType: QUEUETYPE,
              queueDate: today,
              queueSessionId: sessionId
            }
          })

        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            attempt++;
            console.warn(`Queue conflict detected, retrying... (attempt: ${attempt})`)
            continue
          }
          throw error
        }
      }
      const reqTypeIds = serviceRequests.map(r => r.requestTypeId);

      const existingRequestData = await tx.requestType.findMany({
        where: { requestTypeId: { in: reqTypeIds } },
        select: { requestTypeId: true }
      });

      const existingIds = existingRequestData.map(r => r.requestTypeId);
      const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
      }
      
      const requests = await Promise.all(
        reqTypeIds.map(id =>
          tx.request.create({
            data: {
              queueId: newQueue.queueId,
              requestTypeId: id,
              processedBy: null,
              requestStatus: null,
              processedAt: null,
              isActive: true
            }
          })
        )
      );

      if (!newQueue) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate queue after multiple retries"
        })
      }

      if(!requests){
          return res.status(500).json({
          success: false,
          message: "Failed to generate request after multiple retries"
        })
      }

      return res.status(201).json({
        success: true,
        message: "Queue Generated Successfully!",
        data: {queueDetails: newQueue, serviceRequests: requests}
      })
    })

    // const existingQueue = await prisma.queue.findFirst({
    //   where: {
    //     schoolId: studentId,
    //     queueStatus: { in: ['WAITING', 'IN_SERVICE'] },
    //     isActive: true,
    //   },
    // });
    // if (existingQueue)
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Student already has an active queue',
    //   });

    // //generate queue num by type "regular,priority"
    // const queue_num_by_type = await prisma.queue.findFirst({
    //   where: { queueType },
    //   orderBy: { queueNumber: 'desc' },
    // });

    // const queueNumber = queue_num_by_type
    //   ? queue_num_by_type.queueNumber + 1
    //   : 1;

    // //generate queue number
    // const newQueue = await prisma.queue.create({
    //   data: {
    //     schoolId: studentId,
    //     studentFullName: name,
    //     courseId: course.courseId,
    //     yearLevel,
    //     queueType,
    //     queueNumber,
    //     isActive: true,
    //   },
    // });

    // const aheadCount = await prisma.queue.count({
    //   where: {
    //     queueType,
    //     queueStatus: 'WAITING',
    //     isActive: true,
    //     queueId: { lt: newQueue.queueId } 
    //   },
    // });
    // const position = aheadCount + 1;

    // return res.status(201).json({ success: true, queueNumber, position });
  } catch (error) {
    console.error("Error generating queue:", error)
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};


 /* 
 import { Prisma, Queue_Type } from '@prisma/client'
import prisma from '../../prisma/prisma.js'

// Generate Queue Record - Also generates queue number
export const generateQueue = async (req,res)=>{
  const {studentID, fullName, courseID, yearLevel, queueType, studentRequests} = req.body
  try {
    if(!studentID ||!fullName || !courseID || !yearLevel ) return res.status(403).json({success: false, message: "Required Fields are Missing!"})
    // Validate studentRequests exists and is an array
    if (!studentRequests || !Array.isArray(studentRequests) || studentRequests.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Student requests are required and must be a non-empty array"
      })
    }

    if (![Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()].includes(queueType.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Invalid Queue Type!"
      })
    }

    const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase() 
    ? Queue_Type.REGULAR
    : Queue_Type.PRIORITY


    
    const courseData = await prisma.course.findUnique({
      where:{
        courseId: courseID
      },
      select:{
        courseId: true
      }
    })
    if(!courseData) return res.status(404).json({
      success:false,
      message:"Course Data Not Found."
    })
    
    return await prisma.$transaction(async(tx)=>{
      const today = new Date()
      today.setHours(0,0,0,0);


      const activeSession  = await tx.queueSession.findFirst({
        where: {
          sessionDate: today,
          isActive: true
        },
        orderBy:{
          sessionId: 'desc'
        },
        select:{
          sessionId: true,
        }
      })
      let session;
      if(activeSession){
        session = activeSession;
      } else {
        session = await tx.queueSession.create({
          data: { sessionNo: 1, sessionDate: today },
        });
      }
      const sessionId = session.sessionId;
      
      let attempt =0
      let maxRetries =3
      let queue = null;
      
      while(attempt < maxRetries && !queue){
        try {
          const latest = await tx.queue.findFirst({
          where:{
            queueType: QUEUETYPE,
            queueDate: today,
            queueSessionId: sessionId
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
        queue = await tx.queue.create({
            data:{
              schoolId: studentID,
              studentFullName: fullName,
              courseId: courseID,
              yearLevel: yearLevel,
              queueNumber: nextNumber,
              queueType: QUEUETYPE,
              queueDate: today,
              queueSessionId: sessionId
            }
          })

        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            attempt++;
            console.warn(`Queue conflict detected, retrying... (attempt: ${attempt})`)
            continue
          }
          throw error
        }
      }
      const reqTypeIds = studentRequests.map(r => r.requestTypeId);

      const existingRequestData = await tx.requestType.findMany({
        where: { requestTypeId: { in: reqTypeIds } },
        select: { requestTypeId: true }
      });

      const existingIds = existingRequestData.map(r => r.requestTypeId);
      const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
      }
      
      const requests = await Promise.all(
        reqTypeIds.map(id =>
          tx.request.create({
            data: {
              queueId: queue.queueId,
              requestTypeId: id,
              processedBy: null,
              requestStatus: null,
              processedAt: null,
              isActive: true
            }
          })
        )
      );




      if (!queue) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate queue after multiple retries"
        })
      }

      if(!requests){
          return res.status(500).json({
          success: false,
          message: "Failed to generate request after multiple retries"
        })
      }

      return res.status(201).json({
        success: true,
        message: "Queue Generated Successfully!",
        data: queue
      })
    })
  } catch (error) {
    console.error("Error generating queue:", error)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }

}


// queNum && queType && queDate && qeueSess


// 01 R today 1 
// 02 R today 1
// 01 r today 2



 */