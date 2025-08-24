import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ForumService from "../../api/ForumService";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import "./forums.css";

export default function ThreadListPage() {
  const { categoryId } = useParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const catList = await ForumService.getCategories();
      setCategory(catList.find((c) => c._id === categoryId) || null);
      const data = await ForumService.getThreads(categoryId);
      setThreads(data.threads);
    } catch (e) {
      console.log("Error loading threads", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [categoryId]);

  const filtered = useMemo(() => {
    return threads
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "newest")
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "oldest")
          return new Date(a.createdAt) - new Date(b.createdAt);
        return a.title.localeCompare(b.title);
      });
  }, [threads, search, sort]);

  const createThread = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await ForumService.createThread({ categoryId, title });
      setTitle("");
      setShowNew(false);
      load();
    } catch (e) {
      console.log("Error creating thread", e);
    }
  };

  return (
    <div className="forum-page">
      <div className="forum-header">
        <div>
          <h1 className="forum-title">
            {category ? category.name : "Threads"}
          </h1>
          {category && <p className="forum-subtitle">{category.description}</p>}
        </div>
        <div className="forum-actions">
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <PlusIcon className="icon" /> New Discussion
          </button>
        </div>
      </div>
      <div className="forum-toolbar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sort-box">
          <label>Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : (
        <div className="thread-cards">
          {filtered.map((thread) => (
            <div
              key={thread._id}
              className="thread-card"
              onClick={() => navigate(`/forums/threads/${thread._id}`)}
            >
              <div className="thread-card-main">
                <h2>{thread.title}</h2>
                <div className="thread-meta">
                  <span>
                    <ChatBubbleLeftRightIcon className="meta-icon" />{" "}
                    {thread.postsCount || 0} posts
                  </span>
                  <span>
                    By {thread.authorId?.profile?.firstName}{" "}
                    {thread.authorId?.profile?.lastName}
                  </span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No discussions found.</p>
              <button
                className="btn-secondary"
                onClick={() => setShowNew(true)}
              >
                Start first discussion
              </button>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Start a New Discussion</h3>
            <form onSubmit={createThread} className="modal-form">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discussion title"
                maxLength={120}
                required
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNew(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
