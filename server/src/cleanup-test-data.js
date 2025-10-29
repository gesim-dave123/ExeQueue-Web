// cleanup-test-data.js
// Run this script to remove test transactions
// Usage: node cleanup-test-data.js [options]
//
// Options:
//   --all          Delete ALL transactions (dangerous!)
//   --last=N       Delete last N transactions (default: 30)
//   --date=YYYY-MM-DD  Delete transactions from specific date
//   --confirm      Skip confirmation prompt

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  confirm: args.includes('--confirm'),
  last: parseInt(args.find(arg => arg.startsWith('--last='))?.split('=')[1] || '30'),
  date: args.find(arg => arg.startsWith('--date='))?.split('=')[1]
};

// Confirmation prompt
function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function cleanupTestData() {
  try {
    console.log('🧹 Starting cleanup...\n');

    // Build where clause based on options
    let whereClause = {};
    let description = '';

    if (options.all) {
      description = 'ALL transactions and queues';
      if (!options.confirm) {
        console.log('⚠️  WARNING: This will delete ALL transactions and queues!');
        const confirmed = await askConfirmation('Are you ABSOLUTELY sure?');
        if (!confirmed) {
          console.log('❌ Cleanup cancelled.');
          return;
        }
      }
    } else if (options.date) {
      const targetDate = new Date(options.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      whereClause = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
      description = `transactions from ${options.date}`;
    } else {
      description = `last ${options.last} transactions`;
    }

    // Show what will be deleted
    if (!options.all && !options.date) {
      // Get last N transactions
      const transactionsToDelete = await prisma.transactionHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: options.last,
        select: {
          transactionHistoryId: true,
          createdAt: true,
          transactionStatus: true,
          queue: {
            select: {
              studentFullName: true,
              courseCode: true
            }
          }
        }
      });

      if (transactionsToDelete.length === 0) {
        console.log('✅ No transactions found to delete.');
        return;
      }

      console.log(`📋 Found ${transactionsToDelete.length} transactions to delete:\n`);
      transactionsToDelete.slice(0, 5).forEach(t => {
        console.log(`   - ${t.queue.studentFullName} (${t.queue.courseCode}) - ${t.transactionStatus}`);
      });
      if (transactionsToDelete.length > 5) {
        console.log(`   ... and ${transactionsToDelete.length - 5} more\n`);
      }

      if (!options.confirm) {
        const confirmed = await askConfirmation(`\nDelete these ${description}?`);
        if (!confirmed) {
          console.log('❌ Cleanup cancelled.');
          return;
        }
      }

      // Delete by IDs
      const idsToDelete = transactionsToDelete.map(t => t.transactionHistoryId);
      
      const result = await prisma.$transaction(async (tx) => {
        // Get queue IDs first
        const queues = await tx.transactionHistory.findMany({
          where: { transactionHistoryId: { in: idsToDelete } },
          select: { queueId: true }
        });
        const queueIds = [...new Set(queues.map(q => q.queueId))];

        // Delete transaction history
        const deletedTransactions = await tx.transactionHistory.deleteMany({
          where: { transactionHistoryId: { in: idsToDelete } }
        });

        // Delete related requests
        const deletedRequests = await tx.request.deleteMany({
          where: { queueId: { in: queueIds } }
        });

        // Delete queues
        const deletedQueues = await tx.queue.deleteMany({
          where: { queueId: { in: queueIds } }
        });

        return { deletedTransactions, deletedRequests, deletedQueues };
      });

      console.log('\n✅ Cleanup completed:');
      console.log(`   🗑️  Deleted ${result.deletedTransactions.count} transactions`);
      console.log(`   🗑️  Deleted ${result.deletedRequests.count} requests`);
      console.log(`   🗑️  Deleted ${result.deletedQueues.count} queues`);

    } else {
      // Delete by where clause (all or by date)
      if (!options.confirm) {
        const confirmed = await askConfirmation(`\nDelete ${description}?`);
        if (!confirmed) {
          console.log('❌ Cleanup cancelled.');
          return;
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // Get queue IDs to delete
        const transactions = await tx.transactionHistory.findMany({
          where: whereClause,
          select: { queueId: true }
        });
        const queueIds = [...new Set(transactions.map(t => t.queueId))];

        // Delete in order: transactions -> requests -> queues
        const deletedTransactions = await tx.transactionHistory.deleteMany({
          where: whereClause
        });

        const deletedRequests = await tx.request.deleteMany({
          where: { queueId: { in: queueIds } }
        });

        const deletedQueues = await tx.queue.deleteMany({
          where: { queueId: { in: queueIds } }
        });

        return { deletedTransactions, deletedRequests, deletedQueues };
      });

      console.log('\n✅ Cleanup completed:');
      console.log(`   UwU:  Deleted ${result.deletedTransactions.count} transactions`);
      console.log(`   UwU:  Deleted ${result.deletedRequests.count} requests`);
      console.log(`   UwU:  Deleted ${result.deletedQueues.count} queues`);
    }

    // Show remaining count
    const remainingCount = await prisma.transactionHistory.count();
    console.log(`\nRemaining transactions in database: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧹 Transaction Cleanup Script

Usage:
  node cleanup-test-data.js [options]

Options:
  --last=N           Delete last N transactions (default: 30)
  --date=YYYY-MM-DD  Delete transactions from specific date
  --all              Delete ALL transactions (dangerous!)
  --confirm          Skip confirmation prompt
  --help, -h         Show this help message

Examples:
  node cleanup-test-data.js                    # Delete last 30 transactions
  node cleanup-test-data.js --last=50          # Delete last 50 transactions
  node cleanup-test-data.js --date=2025-10-23  # Delete all from Oct 23
  node cleanup-test-data.js --all --confirm    # Delete everything (no prompt)
  `);
  process.exit(0);
}

// Run the cleanup
cleanupTestData();