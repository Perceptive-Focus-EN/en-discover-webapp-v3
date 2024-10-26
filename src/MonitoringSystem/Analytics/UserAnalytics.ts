interface UserSession {
  userId: string;
  startTime: Date;
  lastActive: Date;
  pageViews: {
    path: string;
    timestamp: Date;
    duration: number;
  }[];
  actions: {
    type: string;
    target: string;
    timestamp: Date;
    metadata: Record<string, any>;
  }[];
}

export class UserAnalytics {
  private sessions: Map<string, UserSession> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes

  trackPageView(userId: string, path: string) {
    const session = this.getOrCreateSession(userId);
    const previousPage = session.pageViews[session.pageViews.length - 1];
    
    if (previousPage) {
      previousPage.duration = Date.now() - previousPage.timestamp.getTime();
    }

    session.pageViews.push({
      path,
      timestamp: new Date(),
      duration: 0
    });

    session.lastActive = new Date();
    this.sessions.set(userId, session);
  }

  trackUserAction(userId: string, actionType: string, target: string, metadata: Record<string, any> = {}) {
    const session = this.getOrCreateSession(userId);
    
    session.actions.push({
      type: actionType,
      target,
      timestamp: new Date(),
      metadata
    });

    session.lastActive = new Date();
    this.sessions.set(userId, session);
  }

  private getOrCreateSession(userId: string): UserSession {
    const existingSession = this.sessions.get(userId);
    
    if (existingSession && 
        (Date.now() - existingSession.lastActive.getTime()) < this.sessionTimeout) {
      return existingSession;
    }

    const newSession: UserSession = {
      userId,
      startTime: new Date(),
      lastActive: new Date(),
      pageViews: [],
      actions: []
    };

    this.sessions.set(userId, newSession);
    return newSession;
  }

  generateUserReport(userId: string): Record<string, any> {
    const session = this.sessions.get(userId);
    if (!session) return {};

    const totalDuration = Date.now() - session.startTime.getTime();
    const pageViewCount = session.pageViews.length;
    const actionCount = session.actions.length;
    const averagePageDuration = session.pageViews.reduce(
      (sum, view) => sum + view.duration, 0) / pageViewCount;

    return {
      userId,
      sessionDuration: totalDuration,
      pageViewCount,
      actionCount,
      averagePageDuration,
      mostViewedPages: this.getMostViewedPages(session),
      mostCommonActions: this.getMostCommonActions(session)
    };
  }

  private getMostViewedPages(session: UserSession) {
    const pageCounts = new Map<string, number>();
    session.pageViews.forEach(view => {
      pageCounts.set(view.path, (pageCounts.get(view.path) || 0) + 1);
    });
    return Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  private getMostCommonActions(session: UserSession) {
    const actionCounts = new Map<string, number>();
    session.actions.forEach(action => {
      actionCounts.set(action.type, (actionCounts.get(action.type) || 0) + 1);
    });
    return Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }
}
