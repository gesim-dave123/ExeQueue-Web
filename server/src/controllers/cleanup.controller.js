import prisma from '../../prisma/prisma.js';

export const cleanupDuplicateSessions = async (req, res) => {
  try {
    console.log('🧹 Starting duplicate session cleanup...');

    // Get all active sessions
    const activeSessions = await prisma.queueSession.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${activeSessions.length} active session(s)`);

    // Log the sessions to see their structure
    activeSessions.forEach((s) => {
      console.log('Session:', {
        sessionId: s.sessionId,
        sessionDate: s.sessionDate,
        createdAt: s.createdAt,
      });
    });

    if (activeSessions.length <= 1) {
      return res.status(200).json({
        success: true,
        message: 'No duplicate sessions to clean up',
        activeSessionCount: activeSessions.length,
      });
    }

    // Keep the most recent, deactivate others
    const sessionToKeep = activeSessions[0];
    const sessionsToDeactivate = activeSessions.slice(1);

    // ✅ Use sessionId instead of id
    await prisma.queueSession.updateMany({
      where: {
        sessionId: {
          in: sessionsToDeactivate.map((s) => s.sessionId),
        },
      },
      data: {
        isActive: false,
        isAcceptingNew: false,
        isServing: false,
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Kept session: ${sessionToKeep.sessionId} (${sessionToKeep.sessionDate})`
    );
    console.log(
      `✅ Deactivated ${sessionsToDeactivate.length} duplicate session(s)`
    );

    return res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${sessionsToDeactivate.length} duplicate session(s)`,
      keptSession: {
        sessionId: sessionToKeep.sessionId,
        sessionDate: sessionToKeep.sessionDate,
      },
      deactivatedCount: sessionsToDeactivate.length,
    });
  } catch (error) {
    console.error('❌ Error cleaning up sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clean up sessions',
      error: error.message,
    });
  }
};
