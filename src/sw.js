/**
 * Service Worker for CartoonizeMe PWA
 * 
 * Provides offline capabilities, caching strategies, and background processing
 * for the Progressive Web App functionality.
 * 
 * Requirements addressed:
 * - REQ-053: Progressive Web App (PWA) capabilities
 * - REQ-059: Model caching in browser storage
 * 
 * @author CartoonizeMe Team
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

const CACHE_NAME = 'cartoonizeme-v1';
const MODEL_CACHE_NAME = 'cartoonizeme-models-v1';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);

// Cleanup old caches
cleanupOutdatedCaches();

/**
 * Cache Strategy for TensorFlow.js Models (REQ-059)
 * Cache models for long periods since they don't change often
 */
registerRoute(
    ({ request }) =>
        request.destination === 'unknown' &&
        request.url.includes('tensorflowjs'),
    new CacheFirst({
        cacheName: MODEL_CACHE_NAME,
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                purgeOnQuotaError: true,
            }),
        ],
    })
);

/**
 * Cache Strategy for Static Assets
 * Cache JavaScript, CSS, and other static assets
 */
registerRoute(
    ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'worker',
    new StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            }),
        ],
    })
);

/**
 * Cache Strategy for Images and Media
 */
registerRoute(
    ({ request }) =>
        request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
        ],
    })
);

/**
 * Network First Strategy for HTML Pages
 * Always try network first, fall back to cache
 */
registerRoute(
    ({ request }) => request.destination === 'document',
    new NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
            }),
        ],
    })
);

/**
 * Handle Background Sync for Processing Queue
 * This would be used for queuing video processing tasks
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'video-processing-queue') {
        event.waitUntil(processVideoQueue());
    }
});

/**
 * Process queued video processing tasks
 */
async function processVideoQueue() {
    console.log('📋 Processing video queue in background...');

    try {
        // Get queued processing tasks from IndexedDB
        const queue = await getProcessingQueue();

        for (const task of queue) {
            try {
                // Process video task
                await processVideoTask(task);

                // Remove from queue on success
                await removeFromQueue(task.id);

                // Notify main thread of completion
                await notifyMainThread('processing-complete', task);

            } catch (error) {
                console.error('❌ Background processing failed for task:', task.id, error);

                // Update task with error status
                await updateQueueTask(task.id, { status: 'failed', error: error.message });
            }
        }

    } catch (error) {
        console.error('❌ Failed to process video queue:', error);
    }
}

/**
 * Handle Push Notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: '/assets/icon-192x192.png',
            badge: '/assets/badge-72x72.png',
            tag: 'cartoonizeme-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'View Result',
                    icon: '/assets/view-icon.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: '/assets/dismiss-icon.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 * Handle Notification Clicks
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        // Open the app and navigate to results
        event.waitUntil(
            clients.openWindow('/?view=results')
        );
    }
    // 'dismiss' action or clicking notification body closes notification
});

/**
 * Message Handler for Communication with Main Thread
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_MODEL':
            event.waitUntil(cacheModel(data.modelUrl, data.modelName));
            break;

        case 'CLEAR_CACHE':
            event.waitUntil(clearCache(data.cacheName));
            break;

        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            }));
            break;

        default:
            console.warn('Unknown message type:', type);
    }
});

/**
 * Cache a TensorFlow.js Model
 */
async function cacheModel(modelUrl, modelName) {
    try {
        console.log(`🧠 Caching model: ${modelName}`);

        const cache = await caches.open(MODEL_CACHE_NAME);
        const response = await fetch(modelUrl);

        if (response.ok) {
            await cache.put(modelUrl, response);
            console.log(`✅ Model cached: ${modelName}`);
        } else {
            throw new Error(`Failed to fetch model: ${response.status}`);
        }

    } catch (error) {
        console.error(`❌ Failed to cache model ${modelName}:`, error);
        throw error;
    }
}

/**
 * Clear Specific Cache
 */
async function clearCache(cacheName) {
    try {
        const deleted = await caches.delete(cacheName);
        console.log(`🗑️ Cache ${cacheName} cleared:`, deleted);
        return deleted;
    } catch (error) {
        console.error(`❌ Failed to clear cache ${cacheName}:`, error);
        throw error;
    }
}

/**
 * Get Total Cache Size
 */
async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }

        return totalSize;

    } catch (error) {
        console.error('❌ Failed to calculate cache size:', error);
        return 0;
    }
}

/**
 * Utility Functions for IndexedDB Operations
 * These would be fully implemented for production use
 */
async function getProcessingQueue() {
    // Implementation would use IndexedDB to get queued tasks
    return [];
}

async function removeFromQueue(taskId) {
    // Implementation would remove task from IndexedDB
    console.log(`Removing task ${taskId} from queue`);
}

async function updateQueueTask(taskId, updates) {
    // Implementation would update task in IndexedDB
    console.log(`Updating task ${taskId}:`, updates);
}

async function processVideoTask(task) {
    // Implementation would process video using Web Workers
    console.log(`Processing video task:`, task);
}

async function notifyMainThread(type, data) {
    // Implementation would notify main thread via postMessage
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type, data });
    });
}

/**
 * Installation Event
 */
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing...');

    // Skip waiting to activate immediately
    self.skipWaiting();
});

/**
 * Activation Event
 */
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');

    // Take control of all clients immediately
    event.waitUntil(self.clients.claim());
});

/**
 * Error Handler
 */
self.addEventListener('error', (event) => {
    console.error('🚨 Service Worker error:', event.error);
});

/**
 * Unhandled Rejection Handler
 */
self.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Service Worker unhandled rejection:', event.reason);
}); 