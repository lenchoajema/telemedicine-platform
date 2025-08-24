import apiClient from './apiClient';

const ForumService = {
  getCategories() {
    return apiClient.get('/forums/categories').then(res => res.data.data);
  },
  getThreads(categoryId, page = 1, limit = 20) {
    return apiClient.get(`/forums/categories/${categoryId}/threads`, { params: { page, limit } })
      .then(res => res.data.data);
  },
  getThread(threadId, page = 1, limit = 50) {
    return apiClient.get(`/forums/threads/${threadId}`, { params: { page, limit } })
      .then(res => res.data.data);
  },
  createThread(payload) {
    return apiClient.post('/forums/threads', payload).then(res => res.data.data);
  },
  createPost(threadId, content) {
    return apiClient.post(`/forums/threads/${threadId}/posts`, { content }).then(res => res.data.data);
  }
  ,
  toggleLike(postId) {
    return apiClient.post(`/forums/posts/${postId}/like`).then(res => res.data.data);
  },
  reportPost(postId, reason) {
    return apiClient.post(`/forums/posts/${postId}/report`, { reason }).then(res => res.data.data);
  },
  // Moderation: fetch and update reports
  getReports(status) {
    const params = status ? { status } : {};
    return apiClient.get('/forums/reports', { params }).then(res => res.data.data);
  },
  updateReportStatus(reportId, status) {
    return apiClient.patch(`/forums/reports/${reportId}`, { status }).then(res => res.data.data);
  }
};

export default ForumService;
