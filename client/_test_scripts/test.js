import axios from 'axios';

console.log('🚀 Stress test starting...');

class QueueStressTester {
  constructor(
    baseURL = 'http://localhost:5000',
    concurrency = 10,
    totalRequests = 400
  ) {
    this.baseURL = baseURL;
    this.concurrency = concurrency;
    this.totalRequests = totalRequests;
    this.completed = 0;
    this.errors = 0;
    this.successfulQueues = [];
  }

  generateTestData() {
    const firstNames = [
      'Christian Dave',
      'Maria',
      'John Paul',
      'Sarah',
      'Michael',
      'Jennifer',
      'David',
      'Lisa',
    ];
    const lastNames = [
      'Gesim',
      'Santos',
      'Reyes',
      'Cruz',
      'Garcia',
      'Rivera',
      'Torres',
      'Fernandez',
    ];

    // Updated courses to match your exact table
    const courses = [
      { id: 1, code: 'BSCE', name: 'BS Civil Engineering' },
      { id: 2, code: 'BSCpE', name: 'BS Computer Engineering' },
      { id: 3, code: 'BSEE', name: 'BS Electrical Engineering' },
      { id: 4, code: 'BSECE', name: 'BS Electronics Engineering' },
      { id: 5, code: 'BSME', name: 'BS Mechanical Engineering' },
      { id: 6, code: 'BSCS', name: 'BS Computer Science' },
      { id: 7, code: 'BSIT', name: 'BS Tourism Management' },
      { id: 8, code: 'BSIS', name: 'BS Transportation Management' },
      { id: 9, code: 'BSA', name: 'BS Accountancy' },
      { id: 10, code: 'BSMA', name: 'BS Management Accounting' },
      { id: 11, code: 'BSBA-MM', name: 'BS Business Admin - Marketing' },
      { id: 12, code: 'BSBA-HRM', name: 'BS Business Admin - HRM' },
      { id: 13, code: 'BSEd', name: 'BS Education' },
      { id: 14, code: 'BSN', name: 'BS Nursing' },
      { id: 15, code: 'BSCrim', name: 'BS Criminology' },
      { id: 16, code: 'BSMT', name: 'BS Marine Transportation' },
      { id: 17, code: 'BSMarE', name: 'BS Marine Engineering' },
      { id: 18, code: 'BS-Psych', name: 'BS Psychology' },
      { id: 19, code: 'BSPharm', name: 'BS Pharmacy' },
    ];

    const yearLevels = ['1st', '2nd', '3rd', '4th'];
    const queueTypes = ['Priority', 'Regular'];

    const requestTypes = [
      { id: 1, name: 'Good Moral Certificate' },
      { id: 2, name: 'Insurance Payment' },
      { id: 3, name: 'Transcript of Records' },
      { id: 4, name: 'Enrollment Certificate' },
      { id: 5, name: 'Cross Enrollment' },
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const course = courses[Math.floor(Math.random() * courses.length)];
    const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
    const queueType = queueTypes[Math.floor(Math.random() * queueTypes.length)];

    // Generate random student ID
    const studentId = String(Math.floor(Math.random() * 90000000) + 10000000);

    // Select 1-3 random service requests
    const numRequests = Math.floor(Math.random() * 3) + 2;
    const shuffledRequests = [...requestTypes].sort(() => 0.5 - Math.random());
    const serviceRequests = shuffledRequests
      .slice(0, numRequests)
      .map((req) => ({
        requestTypeId: req.id,
        requestName: req.name,
      }));

    return {
      fullName: `${lastName}, ${firstName}`,
      studentId: studentId,
      courseId: course.id,
      courseCode: course.code,
      yearLevel: yearLevel,
      queueType: queueType,
      serviceRequests: serviceRequests,
    };
  }

  async sendRequest(requestId) {
    try {
      const testData = this.generateTestData();
      console.log(
        `[Request ${requestId}] Student: ${testData.fullName} (${testData.studentId})`
      );
      console.log(
        `           Course: ${testData.courseCode} (ID: ${testData.courseId}) - ${testData.yearLevel}`
      );
      console.log(`           Queue Type: ${testData.queueType}`);
      console.log(
        `           Services: ${testData.serviceRequests
          .map((s) => s.requestName)
          .join(', ')}`
      );

      const response = await axios.post(
        `${this.baseURL}/api/student/queue/generate`,
        testData,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      this.completed++;
      this.successfulQueues.push(response.data);
      console.log(`[Request ${requestId}] ✅ SUCCESS:`, response.data);
      return { success: true, data: response.data };
    } catch (error) {
      this.errors++;
      this.completed++;
      console.log(
        `[Request ${requestId}] ❌ ERROR:`,
        error.response?.status || error.code
      );
      if (error.response?.data) {
        console.log('   Error details:', error.response.data);
      }
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async runTest() {
    console.log('🚀 Starting Queue Generation Concurrency Test');
    console.log('='.repeat(70));
    console.log(`Target: ${this.baseURL}/api/student/queue/generate`);
    console.log(`Concurrency: ${this.concurrency} users`);
    console.log(`Total Requests: ${this.totalRequests}`);
    console.log('='.repeat(70));

    const startTime = Date.now();
    const batches = Math.ceil(this.totalRequests / this.concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * this.concurrency;
      const batchSize = Math.min(
        this.concurrency,
        this.totalRequests - batchStart
      );

      console.log(
        `\n📦 Batch ${
          batch + 1
        }/${batches} (${batchSize} concurrent requests)...`
      );

      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const requestId = batchStart + i + 1;
        promises.push(this.sendRequest(requestId));
      }

      await Promise.all(promises);

      if (batch < batches - 1) {
        console.log('💤 Waiting 1 second before next batch...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log('\n' + '='.repeat(70));
    console.log('📊 QUEUE GENERATION CONCURRENCY TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`🏁 Total Requests: ${this.totalRequests}`);
    console.log(`✅ Successful: ${this.totalRequests - this.errors}`);
    console.log(`❌ Errors: ${this.errors}`);
    console.log(
      `📈 Success Rate: ${(
        ((this.totalRequests - this.errors) / this.totalRequests) *
        100
      ).toFixed(2)}%`
    );
    console.log(`⏱️ Total Time: ${totalTime.toFixed(2)} seconds`);
    console.log(
      `⚡ Requests/Second: ${(this.totalRequests / totalTime).toFixed(2)}`
    );

    if (this.successfulQueues.length > 0) {
      const queueNumbers = this.successfulQueues
        .map((q) => q.queue_number)
        .filter(Boolean);
      if (queueNumbers.length > 0) {
        const uniqueQueues = [...new Set(queueNumbers)];
        const duplicates = queueNumbers.length - uniqueQueues.length;

        console.log(`🔢 Unique Queue Numbers: ${uniqueQueues.length}`);
        console.log(`🔄 Duplicate Queue Numbers: ${duplicates}`);

        if (duplicates > 0) {
          console.log('🚨 WARNING: Duplicate queue numbers detected!');
        }
      }

      console.log(`\n📋 Sample successful queue data:`);
      console.log(JSON.stringify(this.successfulQueues[0], null, 2));
    }
    console.log('='.repeat(70));
  }
}

// Run the test
const tester = new QueueStressTester();
tester.runTest().catch((error) => {
  console.error('Test failed:', error);
});
