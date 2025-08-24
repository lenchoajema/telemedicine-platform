import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ForumService from "../../api/ForumService";
import { useNotifications } from "../../contexts/NotificationContextCore";
import { useAuth } from "../../contexts/useAuth";

export default function ThreadDetailPage() {
  const { threadId } = useParams();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchThread = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await ForumService.getThread(threadId, pageNum);
      setThread(data.thread);
      setPosts(data.posts);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err) {
      console.log("Error loading thread detail", err);
      addNotification("Failed to load thread", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread(page);
  }, [threadId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await ForumService.createPost(threadId, content);
      setContent("");
      addNotification("Reply posted", "success");
      fetchThread(1);
    } catch (err) {
      console.log("Error posting reply", err);
      addNotification("Failed to post reply", "error");
    }
  };

  const handleLike = async (postId) => {
    try {
      const result = await ForumService.toggleLike(postId);
      setLikedPosts((prev) => {
        const copy = new Set(prev);
        if (result.liked) copy.add(postId);
        else copy.delete(postId);
        return copy;
      });
    } catch (err) {
      console.log("Error toggling like", err);
      addNotification("Failed to toggle like", "error");
    }
  };

  const handleReport = async (postId) => {
    const reason = window.prompt("Reason for reporting this post:");
    if (!reason) return;
    try {
      await ForumService.reportPost(postId, reason);
      addNotification("Post reported", "success");
    } catch (err) {
      console.log("Error reporting post", err);
      addNotification("Failed to report post", "error");
    }
  };

  if (loading) return <div>Loading thread...</div>;
  if (!thread) return <div>Thread not found</div>;

  return (
    <div className="thread-detail-page">
      <h1>{thread.title}</h1>
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post._id} className="post-item">
            <p>
              <strong>
                {post.authorId.profile.firstName}{" "}
                {post.authorId.profile.lastName}
              </strong>{" "}
              said:
            </p>
            <div>{post.content}</div>
            <div className="post-actions">
              <button onClick={() => handleLike(post._id)}>
                {likedPosts.has(post._id) ? "Unlike" : "Like"}
              </button>
              <button onClick={() => handleReport(post._id)}>Report</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination-controls">
        <button disabled={page <= 1} onClick={() => fetchThread(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => fetchThread(page + 1)}>
          Next
        </button>
      </div>
      <form onSubmit={handleReply} className="reply-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write your reply..."
          required
        />
        <button type="submit">Submit Reply</button>
      </form>
    </div>
  );
}
