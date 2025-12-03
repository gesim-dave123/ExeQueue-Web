import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

console.log("🚀 Historical Data Populator - Version 3 (Analytics Focus)");
console.log("📅 Creates historical data for ANALYTICS - Previous days only\n");

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

function getPreviousDaysInWeek() {
  const now = new Date();
  const today = now.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Get Monday of current week
  const monday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const dates = [];

  // Generate dates from Monday up to yesterday
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    
    // Only add dates that are before today AND not in the future
    if (date < now && date.toDateString() !== now.toDateString()) {
      dates.push(date);
    } else {
      break; // Stop when we reach today or future dates
    }
  }

  return dates;
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// ============ DATA FROM SEED FILE ============

// MODIFIED: Most names now have "Cruz" as last name
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

  // MODIFIED: Heavy bias towards BSEE (Electrical Engineering)
  generateStudentData() {
    const studentFullName =
      studentNames[Math.floor(Math.random() * studentNames.length)];
    
    // 75% chance of BSEE, 25% for all others
    let courseCode;
    if (Math.random() < 0.75) {
      courseCode = "BSEE";
    } else {
      const courseCodes = Object.keys(this.courseMap).filter(code => code !== "BSEE");
      courseCode = courseCodes[Math.floor(Math.random() * courseCodes.length)];
    }
    
    const courseName = this.courseMap[courseCode].name;
    const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
    const studentId = `2023${String(
      Math.floor(Math.random() * 9000) + 1000
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
    // For analytics data - realistic distribution for completed days
    const rand = Math.random();

    if (rand < 0.65) return "COMPLETED"; // 65% completed
    if (rand < 0.80) return "CANCELLED"; // 15% cancelled
    // Remaining 20%: DEFERRED for analytics testing
    return "DEFERRED";
  }

 getWindowForQueue(status, isPriority) {
  // For DEFERRED queues that will be partially processed (40% chance in createQueue)
  // They should have a window assigned
  if (status === "DEFERRED") {
    // 40% of deferred queues will get windows (matching the 40% in createQueue)
    if (Math.random() < 0.4) {
      const window1 = this.windows.find((w) => w.windowNo === 1);
      const window2 = this.windows.find((w) => w.windowNo === 2);

      if (isPriority) {
        return window2?.windowId;
      }

      return Math.random() > 0.5 ? window1?.windowId : window2?.windowId;
    }
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
  // For DEFERRED queues that will be partially processed
  if (status === "DEFERRED" && Math.random() < 0.4) {
    const scholars = [
      this.staff.working,
      this.staff.working2,
      this.staff.working3,
      this.staff.working4,
    ].filter((s) => s);

    return scholars[Math.floor(Math.random() * scholars.length)]?.sasStaffId;
  }

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
  let servedByStaff = staffId;

  // For DEFERRED queues: 40% chance to have partial processing data (called but not completed)
  if (status === "DEFERRED" && Math.random() < 0.4) {
    // These are "partially processed" deferred queues - they were called but not completed
    calledAt = getRandomBusinessTime(
      date,
      sessionNumber === 1 ? 9 : 13,
      sessionNumber === 1 ? 11 : 16
    );
    // No completedAt - they were deferred before completion
    servedByStaff = staffId; // They were served by someone
  }
  // Set calledAt and completedAt for COMPLETED or CANCELLED queues
  else if (status === "COMPLETED" || status === "CANCELLED") {
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
    servedByStaff = staffId;
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
      servedByStaff,
      calledAt,
      completedAt,
      isActive: true,
      createdAt,
    },
  });

  this.stats.totalQueues++;
  return queue;
}

  // MODIFIED: Heavy bias towards Insurance request AND includes STALLED requests for deferred queues
// MODIFIED: Heavy bias towards Insurance request AND includes STALLED requests for deferred queues
async createRequestsForQueue(queue, date) {
  const numRequests = Math.floor(Math.random() * 3) + 1; // 1-3 requests
  
  // Find Insurance request type
  const insuranceType = this.requestTypes.find(rt => rt.requestName === "Insurance");
  const otherTypes = this.requestTypes.filter(rt => rt.requestName !== "Insurance");
  
  const selectedTypes = [];
  
  // 80% chance to include Insurance as first request
  if (insuranceType && Math.random() < 0.8) {
    selectedTypes.push(insuranceType);
  }
  
  // Fill remaining slots with random other types
  const remainingSlots = numRequests - selectedTypes.length;
  if (remainingSlots > 0) {
    const shuffledOthers = [...otherTypes].sort(() => 0.5 - Math.random());
    selectedTypes.push(...shuffledOthers.slice(0, remainingSlots));
  }
  
  // If Insurance wasn't added yet and we still have room, add random types
  if (selectedTypes.length < numRequests) {
    const remaining = [...this.requestTypes]
      .filter(rt => !selectedTypes.includes(rt))
      .sort(() => 0.5 - Math.random());
    selectedTypes.push(...remaining.slice(0, numRequests - selectedTypes.length));
  }

  let stalledRequests = 0; // Track stalled requests

  for (const requestType of selectedTypes) {
    let requestStatus = "WAITING"; // All requests start as WAITING
    let processedBy = queue.servedByStaff;
    let processedAt = queue.completedAt || queue.calledAt;

    // For COMPLETED queues
    if (queue.queueStatus === "COMPLETED") {
      const rand = Math.random();
      if (rand < 0.9) {
        requestStatus = "COMPLETED"; // 90% completed
      } else if (rand < 0.95) {
        requestStatus = "SKIPPED"; // 5% skipped (no STALLED for completed queues)
      } else {
        requestStatus = "SKIPPED"; // 5% skipped
      }
    } 
    // For CANCELLED queues
    else if (queue.queueStatus === "CANCELLED") {
      requestStatus = "CANCELLED";
    } 
    // For DEFERRED queues - SPECIAL LOGIC
    else if (queue.queueStatus === "DEFERRED") {
      // Check if this is a partially processed deferred queue (has calledAt and servedByStaff)
      const isPartiallyProcessed = queue.calledAt && queue.servedByStaff;
      
      if (isPartiallyProcessed) {
        // This queue was called and partially processed before being deferred
        const rand = Math.random();
        if (rand < 0.4) {
          requestStatus = "STALLED"; // 40% stalled - was being processed but got stuck
          stalledRequests++;
        } else if (rand < 0.8) {
          requestStatus = "DEFERRED"; // 40% deferred normally
        } else {
          requestStatus = "WAITING"; // 20% still waiting
        }
      } else {
        // Regular deferred queue (not called/processed)
        const rand = Math.random();
        if (rand < 0.7) {
          requestStatus = "DEFERRED"; // 70% deferred
        } else {
          requestStatus = "WAITING"; // 30% still waiting
        }
      }
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

  return stalledRequests; // Return the count
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

    // Add IN_SERVICE transaction for queues that were served (not DEFERRED)
    if (queue.calledAt && queue.queueStatus !== "DEFERRED") {
      transactions.push({
        queueId: queue.queueId,
        requestId: request.requestId,
        performedById: queue.servedByStaff || this.staff.working.sasStaffId,
        performedByRole: "WORKING_SCHOLAR",
        transactionStatus: "IN_SERVICE",
        createdAt: queue.calledAt,
      });
    }

    // Add final status transaction for completed/cancelled
    if ((queue.completedAt && queue.queueStatus !== "DEFERRED") ||
        (queue.calledAt && queue.queueStatus === "CANCELLED")) {
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
    // For DEFERRED queues, add a DEFERRED transaction
    else if (queue.queueStatus === "DEFERRED") {
      const deferredAt = new Date(queue.createdAt);
      deferredAt.setMinutes(deferredAt.getMinutes() + Math.floor(Math.random() * 30) + 10);
      
      transactions.push({
        queueId: queue.queueId,
        requestId: request.requestId,
        performedById: this.staff.admin.sasStaffId,
        performedByRole: "PERSONNEL",
        transactionStatus: "DEFERRED",
        createdAt: deferredAt,
      });
    }

    if (transactions.length > 0) {
      await prisma.transactionHistory.createMany({ data: transactions });
      this.stats.totalTransactions += transactions.length;
    }
  }

  // ============ MAIN EXECUTION ============

  async populateDay(date) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    
    console.log(
      `\n📅 ${dayName} - ${date.toDateString()} [HISTORICAL FOR ANALYTICS]`
    );

    // Initialize stats for this day
    this.stats.byDay[dayName] = {
      queues: 0,
      completed: 0,
      cancelled: 0,
      deferred: 0,
      stalledRequests: 0,
      totalRequests: 0,
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
          isAcceptingNew: false,
          isServing: false,
          isActive: false,
        },
      });

      console.log(`  Session ${sessionNum}:`);

      // Vary queue count per day for more realistic analytics
      const dayMultiplier = (sessionNum === 1) ? 1.0 : 0.8; // Afternoon sessions have fewer queues
      const queueCount = Math.floor(Math.random() * 15) + 15; // 15-30 queues per session
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

        // Count stalled requests for deferred queues
        const stalledCount = await this.createRequestsForQueue(queue, date);

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
      const now = new Date();
      const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
      
      console.log("=".repeat(70));
      console.log("📊 ANALYTICS DATA POPULATOR - VERSION 3");
      console.log("=".repeat(70));
      console.log(`📅 Today is: ${dayName} (${now.toDateString()})`);
      console.log("🔧 MODIFICATIONS APPLIED:");
      console.log("   • Only generates data for PREVIOUS days in current week");
      console.log("   • 20% of queues are DEFERRED for analytics testing");
      console.log("   • DEFERRED queues can have STALLED requests (30% chance)");
      console.log("   • 75% of students enrolled in BSEE");
      console.log("   • 80% of queues include Insurance request");
      console.log("   • 80% of student names have 'Cruz' as last name");
      console.log("=".repeat(70));

      await this.cleanup();
      await this.seedStaff();
      await this.seedCourses();
      await this.seedRequestTypes();
      await this.seedWindows();

      const dates = getPreviousDaysInWeek();
      console.log(`\n🗓️  Populating ${dates.length} previous day(s) for analytics...\n`);

      if (dates.length === 0) {
        console.log("⚠️  No previous days to populate (maybe it's Monday?)");
        console.log("⚠️  Try running this script on Tuesday or later in the week");
      }

      for (const date of dates) {
        await this.populateDay(date);
      }

      // Print detailed summary
      console.log("\n" + "=".repeat(70));
      console.log("📊 ANALYTICS DATA SUMMARY");
      console.log("=".repeat(70));
      console.log(`Total Queues: ${this.stats.totalQueues}`);
      console.log(`Total Requests: ${this.stats.totalRequests}`);
      console.log(`Total Transactions: ${this.stats.totalTransactions}`);

      console.log("\n📈 Breakdown by Day (for Analytics):");
      for (const [day, stats] of Object.entries(this.stats.byDay)) {
        console.log(`\n  ${day}:`);
        console.log(`    Total Queues: ${stats.queues}`);
        console.log(`    • Completed: ${stats.completed} (${stats.queues > 0 ? Math.round((stats.completed/stats.queues)*100) : 0}%)`);
        console.log(`    • Cancelled: ${stats.cancelled} (${stats.queues > 0 ? Math.round((stats.cancelled/stats.queues)*100) : 0}%)`);
        console.log(`    • Deferred: ${stats.deferred} (${stats.queues > 0 ? Math.round((stats.deferred/stats.queues)*100) : 0}%)`);
        
        // Calculate stalled percentage from deferred queues
        const stalledFromDeferred = stats.deferred > 0 ? Math.round(stats.deferred * 0.3) : 0;
        console.log(`    • Estimated STALLED requests from deferred: ~${stalledFromDeferred}`);
      }

      console.log("\n🎯 ANALYTICS FEATURES TESTED:");
      console.log("   • Daily queue completion rates");
      console.log("   • Partially-processed DEFERRED queues (40% have calledAt/servedBy)");
      console.log("   • STALLED requests from partially-processed DEFERRED queues (40% chance)");
      console.log("   • Service window performance");
      console.log("   • Request type frequency (Insurance bias)");
      console.log("\n⚠️  NOTES:");
      console.log("   • STALLED requests only from DEFERRED queues with calledAt/servedByStaff");
      console.log("   • 40% of DEFERRED queues have partial processing data");
      console.log("   • 40% of requests from partially-processed DEFERRED queues are STALLED");
      console.log("   • Window assignments NOT created - add manually via your app");
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

const populator = new AnalyticsPopulator();
populator.run().catch(console.error);