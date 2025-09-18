import prisma from '../../prisma/prisma.js';

export const createQueue = async (req, res) => {
  try {
    const {
      name,
      studentId,
      courseId,
      courseCode,
      yearLevel,
      queueType,
      serviceIds,
    } = req.body;
    if (
      !name?.trim() ||
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

    if (!['1', '2', '3', '4'].includes(yearLevel))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid year level' });

    const course = await prisma.course.findFirst({
      where: {
        courseCode: {
          equals: courseCode,
          mode: 'insensitive',
        },
        isActive: true,
      },
    });
    if (!course || !course.isActive)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });

    const existingQueue = await prisma.queue.findFirst({
      where: {
        schoolId: studentId,
        queueStatus: { in: ['WAITING', 'IN_SERVICE'] },
        isActive: true,
      },
    });
    if (existingQueue)
      return res.status(400).json({
        success: false,
        message: 'Student already has an active queue',
      });

    //generate queue num by type "regular,priority"
    const queue_num_by_type = await prisma.queue.findFirst({
      where: { queueType },
      orderBy: { queueNumber: 'desc' },
    });

    const queueNumber = queue_num_by_type
      ? queue_num_by_type.queueNumber + 1
      : 1;

    //generate queue number
    const newQueue = await prisma.queue.create({
      data: {
        schoolId: studentId,
        studentFullName: name,
        courseId: course.courseId,
        yearLevel,
        queueType,
        queueNumber,
        isActive: true,
      },
    });

    const aheadCount = await prisma.queue.count({
      where: {
        queueType,
        queueStatus: 'WAITING',
        isActive: true,
        queueId: { lt: newQueue.queueId },
      },
    });
    const position = aheadCount + 1;

    return res.status(201).json({ success: true, queueNumber, position });
  } catch (error) {
    'Error registering queue', error;
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};
