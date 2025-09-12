import bcrypt from "bcryptjs";
import { Role } from "../src/generated/prisma/index.js";
import prisma from "./prisma.js";

async function main() {
  // ----------------------
  // 1. Seed Courses
  // ----------------------

  await prisma.sasStaff.deleteMany({
    where: {
      email: {
        in: [
          'admin@gmail.com',
          'admin2@gmail.com',
          'working@gmail.com',
          'working2@gmail.com'
        ]
      }
    }
  })

  const adminPassword = await bcrypt.hash("admin123456", 12)
  const workingPassword = await bcrypt.hash("working123456", 12)

  const admin1 = await prisma.sasStaff.create({
    data: {
      username: 'admin',
      hashed_password: adminPassword,
      first_name: 'Jacinth',
      last_name: 'Barral',
      email: 'admin@gmail.com',
      role: Role.PERSONNEL,
      is_active: true
    }
  })

  const admin2 = await prisma.sasStaff.create({
    data: {
      username: 'admin2',
      hashed_password: adminPassword,
      first_name: 'Christian Dave',
      last_name: 'Gesim',
      email: 'admin2@gmail.com',
      role: Role.PERSONNEL,
      is_active: true
    }
  })

  const working = await prisma.sasStaff.create({
    data: {
      username: 'working',
      hashed_password: workingPassword,
      first_name: 'Christian Dave',
      last_name: 'Gesim',
      email: 'working@gmail.com',
      role: Role.WORKING_SCHOLAR,
      is_active: true
    }
  })

  const working2 = await prisma.sasStaff.create({
    data: {
      username: 'working2',
      hashed_password: workingPassword,
      first_name: 'Jacinth',
      last_name: 'Barral',
      email: 'working2@gmail.com',
      role: Role.WORKING_SCHOLAR,
      is_active: true
    }
  })

  console.log('Seed data created successfully:')
  console.log('Admin accounts (password: admin123456):')
  console.log(`- admin: admin123456`)
  console.log(`- admin2: admin123456`)
  console.log('Working scholar accounts (password: working123456):')
  console.log(`- working: working123456`)
  console.log(`- working2: working123456`)
  
  console.log('\nUse these passwords for login testing')


  await prisma.student.deleteMany(); // first delete all students
  await prisma.course.deleteMany();  // then delete courses
  // await prisma.course.deleteMany(); // delete all existing courses

  // Reset auto-increment for courses
  await prisma.$executeRaw`ALTER SEQUENCE "course_course_id_seq" RESTART WITH 1;`;

  const coursesData = [
    { course_code: 'BSCE', course_name: 'Bachelor of Science in Civil Engineering' },
    { course_code: 'BSCpE', course_name: 'Bachelor of Science in Computer Engineering' },
    { course_code: 'BSEE', course_name: 'Bachelor of Science in Electrical Engineering' },
    { course_code: 'BSECE', course_name: 'Bachelor of Science in Electronics Engineering' },
    { course_code: 'BSME', course_name: 'Bachelor of Science in Mechanical Engineering' },
    { course_code: 'BSCS', course_name: 'Bachelor of Science in Computer Science' },
    { course_code: 'BSIT', course_name: 'Bachelor of Science in Information Technology' },
    { course_code: 'BSIS', course_name: 'Bachelor of Science in Information Systems' },
    { course_code: 'BSA', course_name: 'Bachelor of Science in Accountancy' },
    { course_code: 'BSMA', course_name: 'Bachelor of Science in Management Accounting' },
    { course_code: 'BSBA-MM', course_name: 'BSBA Major in Marketing Management' },
    { course_code: 'BSBA-HRM', course_name: 'BSBA Major in Human Resource Management' },
    { course_code: 'BSEd', course_name: 'Bachelor of Secondary Education' },
    { course_code: 'BSN', course_name: 'Bachelor of Science in Nursing' },
    { course_code: 'BSCrim', course_name: 'Bachelor of Science in Criminology' },
    { course_code: 'BSMT', course_name: 'Bachelor of Science in Marine Transportation' },
    { course_code: 'BSMarE', course_name: 'Bachelor of Science in Marine Engineering' },
    { course_code: 'BS-Psych', course_name: 'Bachelor of Science in Psychology' },
    { course_code: 'BSPharm', course_name: 'Bachelor of Science in Pharmacy' },
  ];

  await prisma.course.createMany({ data: coursesData });
  console.log(`Seeded ${coursesData.length} courses successfully!`);

  // ----------------------
  // 2. Seed Students
  // ----------------------
  // await prisma.student.deleteMany(); // delete all existing students

  // Reset auto-increment for students
  // await prisma.$executeRaw`ALTER SEQUENCE "student_stud_id_seq" RESTART WITH 1;`;

  // Map course codes to IDs
  const courses = await prisma.course.findMany();
  const courseMap = {};
  courses.forEach(course => {
    courseMap[course.course_code] = course.course_id;
  });

  const studentsData = [
    { school_id: '23784994', full_name: 'Barral, Jacinth Cedric C', course_id: courseMap['BSIT'], year: '3' },
    { school_id: '23784995', full_name: 'Garcia, Maria Sofia R', course_id: courseMap['BSCS'], year: '1' },
    { school_id: '23784996', full_name: 'Santos, Juan Miguel D', course_id: courseMap['BSCE'], year: '2' },
    { school_id: '23784997', full_name: 'Reyes, Anna Patricia L', course_id: courseMap['BSA'], year: '4' },
    { school_id: '23784998', full_name: 'Cruz, Michael Vincent T', course_id: courseMap['BSN'], year: '1' },
    { school_id: '23784999', full_name: 'Lim, Christine Marie O', course_id: courseMap['BSEd'], year: '2' },
    { school_id: '23785000', full_name: 'Torres, James Robert P', course_id: courseMap['BSCrim'], year: '3' },
  ];

  await prisma.student.createMany({ data: studentsData });
  console.log(`Seeded ${studentsData.length} students successfully!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
