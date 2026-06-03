class SessionLockService {
  constructor() {
    this.locks = new Map();
  }

  acquire(sessionId, ttlMs = 5000) {
    if (this.locks.has(sessionId)) return false;
    const timeout = setTimeout(() => this.release(sessionId), ttlMs);
    this.locks.set(sessionId, { locked: true, lockedAt: new Date(), timeout });
    return true;
  }

  release(sessionId) {
    const entry = this.locks.get(sessionId);
    if (entry) {
      clearTimeout(entry.timeout);
      this.locks.delete(sessionId);
    }
  }

  isLocked(sessionId) {
    return this.locks.has(sessionId);
  }
}

export default new SessionLockService();
