import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

console.log("🚀 Historical Data Populator - Version 2");
console.log("📅 Creates historical data with ALL TODAY's queues as WAITING\n");

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

function getCurrentWeekDates() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const dates = [];

  // Add Monday to Saturday (or until today)
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    if (date <= now) {
      dates.push(date);
    }
  }

  return dates;
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// ============ DATA FROM SEED FILE ============

const studentNames = [
  "Smith, John A",
  "Johnson, Mary B",
  "Williams, James C",
  "Brown, Patricia D",
  "Jones, Robert E",
  "Garcia, Jennifer F",
  "Miller, Michael G",
  "Davis, Linda H",
  "Rodriguez, David I",
  "Martinez, Susan J",
  "Hernandez, Joseph K",
  "Lopez, Karen L",
  "Gonzalez, Thomas M",
  "Wilson, Nancy N",
  "Anderson, Charles O",
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
    requestName: "Transmittal Letter",
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
  // Admin accounts
  {
    username: "admin",
    password: "admin123456",
    email: "jacinthcedricbarral@gmail.com",
    firstName: "Jacinth Cedric",
    lastName: "Barral",
    role: "PERSONNEL",
  },
  {
    username: "admin2",
    password: "admin123456",
    email: "christiandavegesim@gmail.com",
    firstName: "Christian Dave",
    lastName: "Gesim",
    role: "PERSONNEL",
  },
  // Working scholars
  {
    username: "working",
    password: "working123456",
    email: "laporrezues@gmail.com",
    firstName: "Zues",
    lastName: "Laporre",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working2",
    password: "working123456",
    email: "abais21@gmail.com",
    firstName: "Aldrie",
    lastName: "Abais",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working3",
    password: "working123456",
    email: "laroco@gmail.com",
    firstName: "Jan Lorenz",
    lastName: "Laroco",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working4",
    password: "working123456",
    email: "exequeueser@gmail.com",
    firstName: "Kathleen",
    lastName: "Sarmiento",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working5",
    password: "working123456",
    email: "satorrelance@gmail.com",
    firstName: "Lance Timothy",
    lastName: "Satorre",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working6",
    password: "working123456",
    email: "umpad@gmail.com",
    firstName: "Luke Harvey",
    lastName: "Umpad",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working7",
    password: "working123456",
    email: "villasan@gmail.com",
    firstName: "John Dave",
    lastName: "Villasan",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working8",
    password: "working123456",
    email: "caballero@gmail.com",
    firstName: "Nadine",
    lastName: "Caballero",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working9",
    password: "working123456",
    email: "villasurda@gmail.com",
    firstName: "Khylle",
    lastName: "Villasurda",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working10",
    password: "working123456",
    email: "singcol@gmail.com",
    firstName: "Samantha",
    lastName: "Singcol",
    role: "WORKING_SCHOLAR",
  },
  // Original accounts (kept for compatibility)
  {
    username: "admin_old",
    password: "admin123456",
    email: "admin@gmail.com",
    firstName: "Jacinth",
    lastName: "Barral",
    role: "PERSONNEL",
  },
  {
    username: "admin2_old",
    password: "admin123456",
    email: "admin2@gmail.com",
    firstName: "Christian Dave",
    lastName: "Gesim",
    role: "PERSONNEL",
  },
  {
    username: "working_old",
    password: "working123456",
    email: "working@gmail.com",
    firstName: "Christian Dave",
    lastName: "Gesim",
    role: "WORKING_SCHOLAR",
  },
  {
    username: "working2_old",
    password: "working123456",
    email: "working2@gmail.com",
    firstName: "Jacinth",
    lastName: "Barral",
    role: "WORKING_SCHOLAR",
  },
];

const yearLevels = ["1", "2", "3", "4"];

// ============ MAIN POPULATOR CLASS ============

class WaitingOnlyPopulator {
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

  // ============ SEED STATIC DATA ============

  async seedStaff() {
    console.log("👥 Seeding staff accounts...");

    for (const account of staffAccounts) {
      const staff = await prisma.sasStaff.create({
        data: {
          username: account.username,
          hashedPassword: await bcrypt.hash(account.password, 12),
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          role: account.role,
          isActive: true,
        },
      });
      this.staff[account.username] = staff;
    }

    console.log(`✅ Created ${staffAccounts.length} staff accounts\n`);
  }

  async seedCourses() {
    console.log("📚 Seeding courses...");

    await prisma.course.createMany({ data: coursesData });

    this.courses = await prisma.course.findMany();

    // Create course map
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

  // ============ GENERATE QUEUE DATA ============

  generateStudentData() {
    const studentFullName =
      studentNames[Math.floor(Math.random() * studentNames.length)];
    const courseCodes = Object.keys(this.courseMap);
    const courseCode =
      courseCodes[Math.floor(Math.random() * courseCodes.length)];
    const courseName = this.courseMap[courseCode].name;
    const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
    const studentId = `2023${String(
      Math.floor(Math.random() * 90000) + 10000
    )}`;

    return {
      studentId,
      studentFullName,
      courseCode,
      courseName,
      yearLevel,
    };
  }

  getQueueStatusForDate(date, isPriority) {
    const today = isToday(date);

    if (!today) {
      // HISTORICAL DAYS: All finalized (NO IN_SERVICE)
      // QUEUE STATUS: Only CANCELLED, COMPLETED, or DEFERRED (no STALLED or SKIPPED for queues)
      const rand = Math.random();

      if (rand < 0.7) return "COMPLETED";
      if (rand < 0.85) return "CANCELLED";
      // Remaining 15%: DEFERRED
      return "DEFERRED";
    } else {
      // TODAY: ALL WAITING
      return "WAITING";
    }
  }

  getWindowForQueue(status, isPriority) {
    if (status === "WAITING" || status === "DEFERRED") {
      return null;
    }

    const window1 = this.windows.find((w) => w.windowNo === 1);
    const window2 = this.windows.find((w) => w.windowNo === 2);

    if (isPriority) {
      return window2?.windowId;
    }

    return Math.random() > 0.5 ? window1?.windowId : window2?.windowId;
  }

  getStaffForQueue(status) {
    if (status === "WAITING" || status === "DEFERRED") return null;

    if (status === "CANCELLED" && Math.random() > 0.5) {
      return this.staff.admin?.sasStaffId;
    }

    const scholars = [
      this.staff.working,
      this.staff.working2,
      this.staff.working3,
      this.staff.working4,
    ].filter((s) => s);

    return scholars[Math.floor(Math.random() * scholars.length)]?.sasStaffId;
  }

  // ============ CREATE QUEUES ============

  async createQueue(session, queueNumber, sequenceNumber, isPriority, date) {
    const studentData = this.generateStudentData();
    const status = this.getQueueStatusForDate(date, isPriority);
    const windowId = this.getWindowForQueue(status, isPriority);
    const staffId = this.getStaffForQueue(status);

    const sessionNumber = session.sessionNumber;
    const createdAt = getRandomBusinessTime(
      date,
      sessionNumber === 1 ? 8 : 13,
      sessionNumber === 1 ? 10 : 15
    );
    let calledAt = null;
    let completedAt = null;

    // Only set calledAt and completedAt for COMPLETED or CANCELLED queues
    if (status === "COMPLETED" || status === "CANCELLED") {
      calledAt = getRandomBusinessTime(
        date,
        sessionNumber === 1 ? 9 : 13,
        sessionNumber === 1 ? 11 : 16
      );

      if (status === "COMPLETED") {
        completedAt = new Date(calledAt);
        completedAt.setMinutes(
          completedAt.getMinutes() + Math.floor(Math.random() * 15) + 5
        );
      } else if (status === "CANCELLED") {
        completedAt = new Date(calledAt);
        completedAt.setMinutes(completedAt.getMinutes() + 1); // Quick cancellation
      }
    }

    // Generate reference number: YYMMDD-S-R001 or YYMMDD-S-P001
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const typePrefix = isPriority ? "P" : "R";
    const referenceNumber = `${yy}${mm}${dd}-${sessionNumber}-${typePrefix}${String(
      queueNumber
    ).padStart(3, "0")}`;

    const queue = await prisma.queue.create({
      data: {
        sessionId: session.sessionId,
        ...studentData,
        queueNumber,
        sequenceNumber,
        referenceNumber,
        queueType: isPriority ? "PRIORITY" : "REGULAR",
        queueStatus: status,
        windowId,
        servedByStaff: staffId,
        calledAt,
        completedAt,
        isActive: true,
        createdAt,
      },
    });

    this.stats.totalQueues++;
    return queue;
  }

  async createRequestsForQueue(queue, date) {
    const numRequests = Math.floor(Math.random() * 3) + 1; // 1-3 requests
    const selectedTypes = [...this.requestTypes]
      .sort(() => 0.5 - Math.random())
      .slice(0, numRequests);

    for (const requestType of selectedTypes) {
      let requestStatus = "WAITING"; // All requests start as WAITING
      let processedBy = queue.servedByStaff;
      let processedAt = queue.completedAt || queue.calledAt;

      // For historical (non-WAITING) queues
      if (queue.queueStatus !== "WAITING") {
        // Requests can have STALLED or SKIPPED status (unlike queues)
        const rand = Math.random();
        if (queue.queueStatus === "COMPLETED") {
          if (rand < 0.9) {
            requestStatus = "COMPLETED"; // 90% completed
          } else if (rand < 0.95) {
            requestStatus = "STALLED"; // 5% stalled
          } else {
            requestStatus = "SKIPPED"; // 5% skipped
          }
        } else if (queue.queueStatus === "CANCELLED") {
          requestStatus = "CANCELLED";
        } else if (queue.queueStatus === "DEFERRED") {
          requestStatus = "DEFERRED";
        }
      } else {
        // For WAITING queues (today), everything is WAITING
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
      await this.createTransactionHistory(queue, request, date);
    }
  }

  async createTransactionHistory(queue, request, date) {
    const transactions = [];

    // Initial WAITING transaction (always created)
    transactions.push({
      queueId: queue.queueId,
      requestId: request.requestId,
      performedById: this.staff.admin.sasStaffId,
      performedByRole: "PERSONNEL",
      transactionStatus: "WAITING",
      createdAt: queue.createdAt,
    });

    // Only add additional transactions for historical (processed) queues
    if (queue.queueStatus !== "WAITING" && queue.queueStatus !== "DEFERRED") {
      // Add IN_SERVICE transaction for queues that were served
      if (queue.calledAt) {
        transactions.push({
          queueId: queue.queueId,
          requestId: request.requestId,
          performedById: queue.servedByStaff || this.staff.working.sasStaffId,
          performedByRole: "WORKING_SCHOLAR",
          transactionStatus: "IN_SERVICE",
          createdAt: queue.calledAt,
        });
      }

      // Add final status transaction
      if (
        queue.completedAt ||
        (queue.calledAt && queue.queueStatus === "CANCELLED")
      ) {
        transactions.push({
          queueId: queue.queueId,
          requestId: request.requestId,
          performedById: queue.servedByStaff || this.staff.working.sasStaffId,
          performedByRole:
            queue.queueStatus === "CANCELLED" &&
            queue.servedByStaff === this.staff.admin.sasStaffId
              ? "PERSONNEL"
              : "WORKING_SCHOLAR",
          transactionStatus: queue.queueStatus,
          createdAt: queue.completedAt || queue.calledAt,
        });
      }
    }

    if (transactions.length > 0) {
      await prisma.transactionHistory.createMany({ data: transactions });
      this.stats.totalTransactions += transactions.length;
    }
  }

  // ============ MAIN EXECUTION ============

  async populateDay(date) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const isCurrentDay = isToday(date);

    console.log(
      `\n📅 ${dayName} - ${date.toDateString()} ${
        isCurrentDay ? "[TODAY - ALL WAITING]" : "[HISTORICAL]"
      }`
    );

    this.stats.byDay[dayName] = {
      queues: 0,
      waiting: 0,
      completed: 0,
      cancelled: 0,
      deferred: 0,
    };

    // Create 2 sessions per day
    for (let sessionNum = 1; sessionNum <= 2; sessionNum++) {
      const session = await prisma.queueSession.create({
        data: {
          sessionDate: date,
          sessionNumber: sessionNum,
          maxQueueNo: 100,
          currentQueueCount: 0,
          regularCount: 0,
          priorityCount: 0,
          isAcceptingNew: isCurrentDay && sessionNum === 2,
          isServing: isCurrentDay,
          isActive: isCurrentDay,
        },
      });

      console.log(`  Session ${sessionNum}:`);

      const queueCount = isCurrentDay ? 25 : 25;
      let regularSeq = 1;
      let prioritySeq = 1;

      for (let i = 1; i <= queueCount; i++) {
        const isPriority = Math.random() > 0.7; // 30% priority
        const sequenceNumber = isPriority ? prioritySeq++ : regularSeq++;

        const queue = await this.createQueue(
          session,
          i,
          sequenceNumber,
          isPriority,
          date
        );

        await this.createRequestsForQueue(queue, date);

        // Update session counts
        await prisma.queueSession.update({
          where: { sessionId: session.sessionId },
          data: {
            currentQueueCount: { increment: 1 },
            regularCount: { increment: isPriority ? 0 : 1 },
            priorityCount: { increment: isPriority ? 1 : 0 },
          },
        });

        // Update stats
        this.stats.byDay[dayName].queues++;
        if (queue.queueStatus === "WAITING")
          this.stats.byDay[dayName].waiting++;
        if (queue.queueStatus === "COMPLETED")
          this.stats.byDay[dayName].completed++;
        if (queue.queueStatus === "CANCELLED")
          this.stats.byDay[dayName].cancelled++;
        if (queue.queueStatus === "DEFERRED")
          this.stats.byDay[dayName].deferred++;
      }

      console.log(`    ✅ Created ${queueCount} queues`);
    }
  }

  async run() {
    try {
      console.log("=".repeat(70));
      console.log(
        "📊 HISTORICAL DATA POPULATOR - VERSION 2 (TODAY = ALL WAITING)"
      );
      console.log("=".repeat(70));

      await this.cleanup();
      await this.seedStaff();
      await this.seedCourses();
      await this.seedRequestTypes();
      await this.seedWindows();

      const dates = getCurrentWeekDates();
      console.log(`\n🗓️  Populating ${dates.length} days...\n`);

      for (const date of dates) {
        await this.populateDay(date);
      }

      // Print summary
      console.log("\n" + "=".repeat(70));
      console.log("📊 POPULATION SUMMARY");
      console.log("=".repeat(70));
      console.log(`Total Queues: ${this.stats.totalQueues}`);
      console.log(`Total Requests: ${this.stats.totalRequests}`);
      console.log(`Total Transactions: ${this.stats.totalTransactions}`);

      console.log("\nBreakdown by Day:");
      for (const [day, stats] of Object.entries(this.stats.byDay)) {
        console.log(`  ${day}:`);
        console.log(`    Total Queues: ${stats.queues}`);
        console.log(`    Waiting: ${stats.waiting}`);
        console.log(`    Completed: ${stats.completed}`);
        console.log(`    Cancelled: ${stats.cancelled}`);
        console.log(`    Deferred: ${stats.deferred}`);
      }

      console.log("\n✅ Population complete!");
      console.log("\n⚠️  KEY DIFFERENCE FROM VERSION 1:");
      console.log(
        "   • Historical days (Mon-Sat before today): Fully processed"
      );
      console.log("   • Today: ALL queues are WAITING (unprocessed)");
      console.log("   • Perfect for testing queue processing workflows!");
      console.log("\n⚠️  QUEUE STATUS RULES:");
      console.log(
        "   • Queues: Only CANCELLED, COMPLETED, DEFERRED, or WAITING"
      );
      console.log(
        "   • Requests: Can be STALLED or SKIPPED (in addition to queue statuses)"
      );
      console.log(
        "\n⚠️  NOTE: Window assignments NOT created - add them manually via your app"
      );
      console.log("=".repeat(70));
    } catch (error) {
      console.error("❌ Error during population:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// ============ RUN ============

const populator = new WaitingOnlyPopulator();
populator.run().catch(console.error);
