import prisma from '../../prisma/prisma.js';
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
