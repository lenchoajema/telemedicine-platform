import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getCategories
} from '../modules/forums/category.controller.js';
import {
  getThreadsByCategory,
  getThreadDetail,
  createThread
} from '../modules/forums/thread.controller.js';
import {
  createPost,
  editPost,
  deletePost
} from '../modules/forums/post.controller.js';
import { toggleLike } from '../modules/forums/like.controller.js';
import {
  subscribeThread,
  unsubscribeThread
} from '../modules/forums/subscription.controller.js';
import { reportPost } from '../modules/forums/report.controller.js';
import * as moderatorCtrl from '../modules/forums/moderator.controller.js';
import { getReports, updateReportStatus } from '../modules/forums/moderation.controller.js';

const router = express.Router();

// Public: list categories
router.get('/categories', authenticate, getCategories);

// Threads
router.get('/categories/:categoryId/threads', authenticate, getThreadsByCategory);
router.get('/threads/:threadId', authenticate, getThreadDetail);
router.post('/threads', authenticate, createThread);

// Posts
router.post('/threads/:threadId/posts', authenticate, createPost);
router.patch('/posts/:postId', authenticate, editPost);
router.delete('/posts/:postId', authenticate, deletePost);

// Likes & Reports
router.post('/posts/:postId/like', authenticate, toggleLike);
router.post('/posts/:postId/report', authenticate, reportPost);

// Subscriptions
router.post(
  '/threads/:threadId/subscribe',
  authenticate,
  subscribeThread
);
router.delete(
  '/threads/:threadId/subscribe',
  authenticate,
  unsubscribeThread
);

// Moderators
router.get('/categories/:categoryId/moderators', authenticate, moderatorCtrl.getModeratorsForCategory);
router.post('/categories/:categoryId/moderators', authenticate, moderatorCtrl.assignModerator);
router.delete('/categories/:categoryId/moderators/:userId', authenticate, moderatorCtrl.removeModerator);

// Moderation Reports
router.get('/reports', authenticate, getReports);
router.patch('/reports/:reportId', authenticate, updateReportStatus);

export default router;
