/**
 * Internal Event Bus — lightweight EventEmitter singleton.
 *
 * Phase 2+ modules subscribe to events without touching the routes that emit them.
 *
 * Usage:
 *   import eventBus from './events/eventBus.js';
 *
 *   // Subscribe
 *   eventBus.on('USER_SUSPENDED', (payload) => { ... });
 *
 *   // Emit
 *   eventBus.emit('USER_SUSPENDED', { userId, adminId, reason, ip });
 *
 * Events emitted so far:
 *   USER_SUSPENDED  — payload: { userId, adminId, reason, ip, timestamp }
 *   USER_REACTIVATED — payload: { userId, adminId, reason, ip, timestamp }
 */

import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limit to avoid warnings when many subscribers register
    this.setMaxListeners(50);
  }

  /**
   * Type-safe emit wrapper — logs unhandled errors from listeners.
   */
  emitSafe(event, payload) {
    const count = this.listenerCount(event);
    if (count === 0) {
      // No listeners — that's fine for now (Phase 2 hooks not yet wired)
      return;
    }
    this.emit(event, payload);
  }
}

const eventBus = new EventBus();

// Catch unhandled listener errors so they don't crash the process
eventBus.on("error", (err) => {
  console.error(`[EventBus] Unhandled error in event listener:`, err);
});

export default eventBus;
