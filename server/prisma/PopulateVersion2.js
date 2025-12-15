import { PrismaClient, Queue_Type, Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

console.log("🚀 Historical Data Populator - Full Past Week + Today");
console.log(
  "📅 Creates historical data for ANALYTICS + Active session for today\n"
);

// ============ UTILITY FUNCTIONS ============

function getRandomBusinessTime(date, startHour = 8, endHour = 17) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const startMs = startHour * 60 * 60 * 1000;
  const endMs = endHour * 60 * 60 * 1000;
  const timeRange = endMs - startMs;

  const randomTimeMs = startMs + Math.floor(Math.random() * timeRange);
  targetDate.setTime(targetDate.getTime() + randomTimeMs);

  return targetDate;
}

function getLastCompletedWeek() {
  const now = new Date();

  // Get Monday of current week
  const currentWeekMonday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekMonday.setDate(diff);
  currentWeekMonday.setHours(0, 0, 0, 0);

  // Go back 7 days to get last week's Monday
  const lastWeekMonday = new Date(currentWeekMonday);
  lastWeekMonday.setDate(currentWeekMonday.getDate() - 7);

  // Generate Monday through Saturday (6 days)
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(lastWeekMonday);
    date.setDate(lastWeekMonday.getDate() + i);
    dates.push(date);
  }

  return dates;
}

function getTodayDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// ============ DATA SEEDS ============

const studentNames = [
  "Cruz, John A",
  "Cruz, Mary B",
  "Cruz, James C",
  "Cruz, Patricia D",
  "Cruz, Robert E",
  "Cruz, Jennifer F",
  "Cruz, Michael G",
  "Cruz, Linda H",
  "Cruz, David I",
  "Cruz, Susan J",
  "Cruz, Joseph K",
  "Cruz, Karen L",
  "Smith, Thomas M",
  "Johnson, Nancy N",
  "Williams, Charles O",
  "Garcia, Anna Marie",
  "Santos, Miguel",
  "Reyes, Sofia",
  "Flores, Diego",
  "Torres, Isabella",
  "Ramos, Carlos",
  "Mendoza, Maria",
  "Castro, Pedro",
  "Morales, Elena",
  "Ortiz, Ricardo",
  "Gutierrez, Carmen",
  "Alvarez, Luis",
];

const coursesData = [
  {
    courseCode: "BSCE",
    courseName: "Bachelor of Science in Civil Engineering",
  },
  {
    courseCode: "BSCpE",
    courseName: "Bachelor of Science in Computer Engineering",
  },
  {
    courseCode: "BSEE",
    courseName: "Bachelor of Science in Electrical Engineering",
  },
  {
    courseCode: "BSECE",
    courseName: "Bachelor of Science in Electronics Engineering",
  },
  {
    courseCode: "BSME",
    courseName: "Bachelor of Science in Mechanical Engineering",
  },
  { courseCode: "BSCS", courseName: "Bachelor of Science in Computer Science" },
  {
    courseCode: "BSIT",
    courseName: "Bachelor of Science in Information Technology",
  },
  {
    courseCode: "BSIS",
    courseName: "Bachelor of Science in Information Systems",
  },
  { courseCode: "BSA", courseName: "Bachelor of Science in Accountancy" },
  {
    courseCode: "BSMA",
    courseName: "Bachelor of Science in Management Accounting",
  },
  { courseCode: "BSBA-MM", courseName: "BSBA Major in Marketing Management" },
  {
    courseCode: "BSBA-HRM",
    courseName: "BSBA Major in Human Resource Management",
  },
  { courseCode: "BSEd", courseName: "Bachelor of Secondary Education" },
  { courseCode: "BSN", courseName: "Bachelor of Science in Nursing" },
  { courseCode: "BSCrim", courseName: "Bachelor of Science in Criminology" },
  {
    courseCode: "BSMT",
    courseName: "Bachelor of Science in Marine Transportation",
  },
  {
    courseCode: "BSMarE",
    courseName: "Bachelor of Science in Marine Engineering",
  },
  { courseCode: "BS-Psych", courseName: "Bachelor of Science in Psychology" },
  { courseCode: "BSPharm", courseName: "Bachelor of Science in Pharmacy" },
];

const requestTypesData = [
  {
    requestName: "Good Moral Certificate",
    description: "Request for Good Moral Certificate",
  },
  { requestName: "Insurance", description: "Insurance Payment" },
  {
    requestName: "Approval/Transmittal Letter",
    description: "Submission of Approval/Transmittal Letter",
  },
  {
    requestName: "Temporary Gate Pass",
    description: "Request for Temporary Gate Pass",
  },
  {
    requestName: "Uniform Exception",
    description: "Request for Uniform Exception",
  },
  { requestName: "Enrollment/Transfer", description: "Enrollment/Transfer" },
];

const staffAccounts = [
  {
    username: "admin",
    password: "admin123456",
    email: "jacinthcedricbarral@gmail.com",
    firstName: "Jacinth Cedric",
    lastName: "Barral",
    role: Role.PERSONNEL,
  },
  {
    username: "admin2",
    password: "admin123456",
    email: "christiandavegesim@gmail.com",
    firstName: "Christian Dave",
    lastName: "Gesim",
    role: Role.PERSONNEL,
  },
  {
    username: "working",
    password: "working123456",
    email: "laporrezues@gmail.com",
    firstName: "Zues",
    lastName: "Laporre",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working2",
    password: "working123456",
    email: "abais21@gmail.com",
    firstName: "Aldrie",
    lastName: "Abais",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working3",
    password: "working123456",
    email: "laroco@gmail.com",
    firstName: "Jan Lorenz",
    lastName: "Laroco",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working4",
    password: "working123456",
    email: "exequeueser@gmail.com",
    firstName: "Kathleen",
    lastName: "Sarmiento",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working5",
    password: "working123456",
    email: "satorrelance@gmail.com",
    firstName: "Lance Timothy",
    lastName: "Satorre",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working6",
    password: "working123456",
    email: "umpad@gmail.com",
    firstName: "Luke Harvey",
    lastName: "Umpad",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working7",
    password: "working123456",
    email: "villasan@gmail.com",
    firstName: "John Dave",
    lastName: "Villasan",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working8",
    password: "working123456",
    email: "caballero@gmail.com",
    firstName: "Nadine",
    lastName: "Caballero",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working9",
    password: "working123456",
    email: "villasurda@gmail.com",
    firstName: "Khylle",
    lastName: "Villasurda",
    role: Role.WORKING_SCHOLAR,
  },
  {
    username: "working10",
    password: "working123456",
    email: "singcol@gmail.com",
    firstName: "Samantha",
    lastName: "Singcol",
    role: Role.WORKING_SCHOLAR,
  },
];

const yearLevels = ["1st", "2nd", "3rd", "4th"];

// ============ POPULATOR CLASS ============

class AnalyticsPopulator {
  constructor() {
    this.staff = {};
    this.windows = [];
    this.courses = [];
    this.requestTypes = [];
    this.courseMap = {};
    this.stats = {
      totalQueues: 0,
      totalRequests: 0,
      totalTransactions: 0,
      byDay: {},
    };
  }

  // ============ CLEANUP ============

  async cleanup() {
    console.log("🧹 Cleaning up existing data...");
    await prisma.transactionHistory.deleteMany();
    await prisma.request.deleteMany();
    await prisma.queue.deleteMany();
    await prisma.queueSession.deleteMany();
    await prisma.windowAssignment.deleteMany();
    await prisma.serviceWindow.deleteMany();
    await prisma.requestType.deleteMany();
    await prisma.course.deleteMany();
    await prisma.sasStaff.deleteMany();
    console.log("✅ Cleanup complete\n");
  }

  // ============ SEEDING STATIC DATA ============

  async seedStaff() {
    console.log("👥 Seeding staff accounts...");
    for (const account of staffAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 12);
      const staff = await prisma.sasStaff.create({
        data: {
          username: account.username,
          hashedPassword,
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          role: account.role,
          isActive: true,
        },
      });
      this.staff[account.username] = staff;
    }
    console.log(
      `✅ Created ${Object.keys(this.staff).length} staff accounts\n`
    );
  }

  async seedCourses() {
    console.log("📚 Seeding courses...");
    await prisma.course.createMany({ data: coursesData });
    this.courses = await prisma.course.findMany();
    this.courses.forEach((course) => {
      this.courseMap[course.courseCode] = {
        code: course.courseCode,
        name: course.courseName,
      };
    });
    console.log(`✅ Created ${this.courses.length} courses\n`);
  }

  async seedRequestTypes() {
    console.log("📋 Seeding request types...");
    await prisma.requestType.createMany({ data: requestTypesData });
    this.requestTypes = await prisma.requestType.findMany();
    console.log(`✅ Created ${this.requestTypes.length} request types\n`);
  }

  async seedWindows() {
    console.log("🪟 Seeding service windows...");
    await prisma.serviceWindow.createMany({
      data: [
        {
          windowNo: 1,
          windowName: "Window 1",
          displayName: "Window 1",
          canServePriority: false,
          canServeRegular: true,
          isActive: true,
        },
        {
          windowNo: 2,
          windowName: "Window 2",
          displayName: "Window 2",
          canServePriority: true,
          canServeRegular: true,
          isActive: true,
        },
      ],
    });
    this.windows = await prisma.serviceWindow.findMany();
    console.log(`✅ Created ${this.windows.length} windows\n`);
  }

  // ============ HELPERS ============

  generateStudentData() {
    const studentFullName =
      studentNames[Math.floor(Math.random() * studentNames.length)];
    let courseCode;
    if (Math.random() < 0.75) {
      courseCode = "BSEE";
    } else {
      const courseCodes = Object.keys(this.courseMap).filter(
        (code) => code !== "BSEE"
      );
      courseCode = courseCodes[Math.floor(Math.random() * courseCodes.length)];
    }
    const courseName = this.courseMap[courseCode].name;
    const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
    const studentId = `2023${String(Math.floor(Math.random() * 9000) + 1000)}`;

    return { studentId, studentFullName, courseCode, courseName, yearLevel };
  }

  getQueueStatusForDate(isToday = false) {
    if (isToday) {
      // For today: mix of completed/processed and waiting (no IN_SERVICE)
      const rand = Math.random();
      if (rand < 0.5) return Status.COMPLETED;
      if (rand < 0.6) return Status.CANCELLED;
      if (rand < 0.8) return Status.WAITING;
      return Status.DEFERRED;
    } else {
      // For past days: everything is completed/cancelled/deferred
      const rand = Math.random();
      if (rand < 0.65) return Status.COMPLETED;
      if (rand < 0.8) return Status.CANCELLED;
      return Status.DEFERRED;
    }
  }

  getWindowForQueue(status, isPriority) {
    if (status === Status.DEFERRED && Math.random() > 0.4) {
      return null;
    }

    const window1 = this.windows.find((w) => w.windowNo === 1);
    const window2 = this.windows.find((w) => w.windowNo === 2);

    if (isPriority) return window2?.windowId;
    return Math.random() > 0.5 ? window1?.windowId : window2?.windowId;
  }

  getStaffForQueue(status) {
    if (status === Status.CANCELLED && Math.random() > 0.5) {
      return this.staff.admin?.sasStaffId;
    }
    // Collect all working scholars
    const scholars = Object.keys(this.staff)
      .filter((key) => key.startsWith("working"))
      .map((key) => this.staff[key])
      .filter((s) => s);

    return (
      scholars[Math.floor(Math.random() * scholars.length)]?.sasStaffId ||
      this.staff.admin.sasStaffId
    );
  }

  // ============ CORE CREATION LOGIC ============

  async createQueue(
    session,
    queueNumber,
    sequenceNumber,
    isPriority,
    date,
    isToday = false
  ) {
    const studentData = this.generateStudentData();
    const status = this.getQueueStatusForDate(isToday);
    const windowId = this.getWindowForQueue(status, isPriority);
    const staffId = windowId ? this.getStaffForQueue(status) : null;

    const sessionNumber = session.sessionNumber;
    const createdAt = getRandomBusinessTime(
      date,
      sessionNumber === 1 ? 8 : 13,
      sessionNumber === 1 ? 10 : 15
    );

    let calledAt = null;
    let completedAt = null;
    let servedByStaff = null;

    // For today's WAITING queues - no processing yet
    if (isToday && status === Status.WAITING) {
      // WAITING queues have no calledAt or servedByStaff
    } else {
      // Historical or completed today data (no IN_SERVICE for today)
      if (
        status !== Status.DEFERRED ||
        (status === Status.DEFERRED && windowId)
      ) {
        calledAt = new Date(createdAt);
        calledAt.setMinutes(
          calledAt.getMinutes() + Math.floor(Math.random() * 30)
        );
        servedByStaff = staffId;
      }

      if (status === Status.COMPLETED) {
        completedAt = new Date(calledAt);
        completedAt.setMinutes(
          completedAt.getMinutes() + Math.floor(Math.random() * 15) + 5
        );
      } else if (status === Status.CANCELLED) {
        completedAt = new Date(calledAt);
        completedAt.setMinutes(completedAt.getMinutes() + 2);
      }
    }

    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const typePrefix = isPriority ? "P" : "R";
    const refNumber = `${yy}${mm}${dd}-${sessionNumber}-${typePrefix}${String(
      queueNumber
    ).padStart(3, "0")}`;

    const queue = await prisma.queue.create({
      data: {
        sessionId: session.sessionId,
        ...studentData,
        queueNumber,
        sequenceNumber,
        referenceNumber: refNumber,
        queueType: isPriority ? Queue_Type.PRIORITY : Queue_Type.REGULAR,
        queueStatus: status,
        windowId: status === Status.WAITING ? null : windowId, // WAITING queues have no window
        servedByStaff,
        calledAt,
        completedAt,
        isActive: true,
        createdAt,
        updatedAt: completedAt || calledAt || createdAt,
      },
    });

    this.stats.totalQueues++;
    return queue;
  }

  async createRequestsForQueue(queue, date, isToday = false) {
    const numRequests = Math.floor(Math.random() * 2) + 1;

    const insuranceType = this.requestTypes.find(
      (rt) => rt.requestName === "Insurance"
    );
    const otherTypes = this.requestTypes.filter(
      (rt) => rt.requestName !== "Insurance"
    );

    const selectedTypes = [];
    if (insuranceType && Math.random() < 0.8) selectedTypes.push(insuranceType);

    while (selectedTypes.length < numRequests) {
      const random = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      if (!selectedTypes.includes(random)) selectedTypes.push(random);
    }

    let stalledRequests = 0;

    for (const requestType of selectedTypes) {
      let requestStatus = Status.WAITING;
      let processedBy = queue.servedByStaff;
      let processedAt = queue.completedAt || queue.calledAt;

      // For today's WAITING queues, requests should also be WAITING
      if (isToday && queue.queueStatus === Status.WAITING) {
        requestStatus = Status.WAITING;
        processedBy = null;
        processedAt = null;
      }
      // Historical or completed data (no IN_SERVICE for today)
      else if (queue.queueStatus === Status.COMPLETED) {
        requestStatus = Math.random() < 0.9 ? Status.COMPLETED : Status.SKIPPED;
      } else if (queue.queueStatus === Status.CANCELLED) {
        requestStatus = Status.CANCELLED;
      } else if (queue.queueStatus === Status.DEFERRED) {
        if (queue.servedByStaff) {
          requestStatus =
            Math.random() < 0.4 ? Status.STALLED : Status.DEFERRED;
          if (requestStatus === Status.STALLED) stalledRequests++;
        } else {
          requestStatus = Status.DEFERRED;
        }
      }

      if (
        requestStatus === Status.WAITING ||
        (requestStatus === Status.DEFERRED && !processedBy)
      ) {
        processedBy = null;
        processedAt = null;
      }

      const request = await prisma.request.create({
        data: {
          queueId: queue.queueId,
          requestTypeId: requestType.requestTypeId,
          processedBy,
          requestStatus,
          processedAt,
          isActive: true,
          createdAt: queue.createdAt,
        },
      });

      this.stats.totalRequests++;
      await this.createTransactionHistory(queue, request, processedBy, isToday);
    }
    return stalledRequests;
  }

  async createTransactionHistory(queue, request, performerId, isToday = false) {
    const transactions = [];

    // 1. Initial Waiting (Created by System/Admin)
    transactions.push({
      queueId: queue.queueId,
      requestId: request.requestId,
      performedById: this.staff.admin.sasStaffId,
      performedByRole: Role.PERSONNEL,
      transactionStatus: Status.WAITING,
      createdAt: queue.createdAt,
    });

    // 2. In Service (if applicable) - only if queue was called
    if (queue.calledAt && performerId) {
      transactions.push({
        queueId: queue.queueId,
        requestId: request.requestId,
        performedById: performerId,
        performedByRole:
          performerId === this.staff.admin.sasStaffId ||
          performerId === this.staff.admin2.sasStaffId
            ? Role.PERSONNEL
            : Role.WORKING_SCHOLAR,
        transactionStatus: Status.IN_SERVICE,
        createdAt: queue.calledAt,
      });
    }

    // 3. Final Status (only for completed data, not for today's WAITING)
    if (!isToday || request.requestStatus !== Status.WAITING) {
      if (
        request.requestStatus !== Status.WAITING &&
        request.requestStatus !== Status.IN_SERVICE
      ) {
        const finalPerformer = performerId || this.staff.admin.sasStaffId;

        transactions.push({
          queueId: queue.queueId,
          requestId: request.requestId,
          performedById: finalPerformer,
          performedByRole:
            finalPerformer === this.staff.admin.sasStaffId ||
            finalPerformer === this.staff.admin2.sasStaffId
              ? Role.PERSONNEL
              : Role.WORKING_SCHOLAR,
          transactionStatus: request.requestStatus,
          createdAt:
            request.processedAt ||
            new Date(queue.createdAt.getTime() + 1000 * 60 * 10),
        });
      }
    }

    if (transactions.length > 0) {
      await prisma.transactionHistory.createMany({ data: transactions });
      this.stats.totalTransactions += transactions.length;
    }
  }

  // ============ EXECUTION LOOP ============

  async populateDay(date, isToday = false) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    console.log(
      `\n📅 ${dayName} - ${date.toDateString()}${
        isToday ? " (TODAY - Active Session)" : ""
      }`
    );

    this.stats.byDay[dayName] = {
      queues: 0,
      completed: 0,
      cancelled: 0,
      deferred: 0,
      waiting: 0,
    };

    for (let sessionNum = 1; sessionNum <= 2; sessionNum++) {
      const session = await prisma.queueSession.create({
        data: {
          sessionDate: date,
          sessionNumber: sessionNum,
          maxQueueNo: 100,
          currentQueueCount: 0,
          regularCount: 0,
          priorityCount: 0,
          isAcceptingNew: isToday, // Today's sessions accept new queues
          isServing: isToday, // Today's sessions are actively serving
          isActive: isToday, // Only today's sessions are active
        },
      });

      const queueCount = Math.floor(Math.random() * 15) + 10;
      let regularSeq = 1;
      let prioritySeq = 1;

      for (let i = 1; i <= queueCount; i++) {
        const isPriority = Math.random() > 0.7;
        const sequenceNumber = isPriority ? prioritySeq++ : regularSeq++;

        const queue = await this.createQueue(
          session,
          i,
          sequenceNumber,
          isPriority,
          date,
          isToday
        );

        await prisma.queueSession.update({
          where: { sessionId: session.sessionId },
          data: {
            currentQueueCount: { increment: 1 },
            regularCount: { increment: isPriority ? 0 : 1 },
            priorityCount: { increment: isPriority ? 1 : 0 },
          },
        });

        await this.createRequestsForQueue(queue, date, isToday);

        this.stats.byDay[dayName].queues++;
        if (queue.queueStatus === Status.COMPLETED)
          this.stats.byDay[dayName].completed++;
        else if (queue.queueStatus === Status.CANCELLED)
          this.stats.byDay[dayName].cancelled++;
        else if (queue.queueStatus === Status.DEFERRED)
          this.stats.byDay[dayName].deferred++;
        else if (queue.queueStatus === Status.WAITING)
          this.stats.byDay[dayName].waiting++;
      }
      console.log(`  ✅ Session ${sessionNum}: Created ${queueCount} queues`);
    }
  }

  async run() {
    try {
      await this.cleanup();
      await this.seedStaff();
      await this.seedCourses();
      await this.seedRequestTypes();
      await this.seedWindows();

      const dates = getLastCompletedWeek();
      const today = getTodayDate();

      console.log(`\n📊 Generating data for last week (${dates.length} days):`);
      console.log(`   From: ${dates[0].toDateString()}`);
      console.log(`   To: ${dates[dates.length - 1].toDateString()}`);
      console.log(
        `   Plus TODAY: ${today.toDateString()} (with active session)\n`
      );

      // Populate last week's historical data
      for (const date of dates) {
        await this.populateDay(date, false);
      }

      // Populate today with active session
      await this.populateDay(today, true);

      console.log("\n" + "=".repeat(50));
      console.log("🏁 POPULATION COMPLETE");
      console.log(
        `Historical Week: ${dates[0].toDateString()} - ${dates[
          dates.length - 1
        ].toDateString()}`
      );
      console.log(`Today (Active): ${today.toDateString()}`);
      console.log(`Total Queues: ${this.stats.totalQueues}`);
      console.log(`Total Requests: ${this.stats.totalRequests}`);
      console.log(`Total Transactions: ${this.stats.totalTransactions}`);
      console.log("\nDaily Breakdown:");
      Object.entries(this.stats.byDay).forEach(([day, stats]) => {
        const statusStr =
          stats.waiting > 0
            ? ` (${stats.completed} completed, ${stats.cancelled} cancelled, ${stats.deferred} deferred, ${stats.waiting} waiting)`
            : ` (${stats.completed} completed, ${stats.cancelled} cancelled, ${stats.deferred} deferred)`;
        console.log(`  ${day}: ${stats.queues} queues${statusStr}`);
      });
      console.log("=".repeat(50));
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

const populator = new AnalyticsPopulator();
populator.run();
