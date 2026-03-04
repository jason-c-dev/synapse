/**
 * Per-user message queue.
 * Different users process concurrently; same user processes sequentially.
 */

const processingUsers = new Set();
const queues = new Map(); // userId → Array<{ ctx, message, opts }>

/**
 * Try to acquire processing lock for a user.
 * @returns {boolean} true if acquired, false if already processing
 */
export function startProcessing(userId) {
  if (processingUsers.has(userId)) return false;
  processingUsers.add(userId);
  return true;
}

/**
 * Release processing lock and return next queued item (if any).
 * @returns {{ ctx, message, opts } | null}
 */
export function doneProcessing(userId) {
  processingUsers.delete(userId);
  const queue = queues.get(userId);
  if (!queue || queue.length === 0) return null;
  return queue.shift();
}

/**
 * Queue a message for later processing.
 * @param {number} userId
 * @param {{ ctx, message, opts }} item
 * @param {number} maxDepth - Maximum queue depth
 * @returns {boolean} true if queued, false if at capacity
 */
export function enqueue(userId, item, maxDepth) {
  let queue = queues.get(userId);
  if (!queue) {
    queue = [];
    queues.set(userId, queue);
  }
  if (queue.length >= maxDepth) return false;
  queue.push(item);
  return true;
}

/**
 * Check if a user is currently being processed.
 */
export function isProcessing(userId) {
  return processingUsers.has(userId);
}

/**
 * Get current queue depth for a user.
 */
export function queueDepth(userId) {
  return queues.get(userId)?.length || 0;
}
