import React, { useState, useEffect, useMemo } from "react";
import ForumService from "../../api/ForumService";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import "./forums.css";

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await ForumService.getCategories();
      setCategories(data);
    } catch (e) {
      console.log("Error loading categories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doRefresh = async () => {
    setRefreshing(true);
    await load();
    setTimeout(() => setRefreshing(false), 400);
  };

  const filtered = useMemo(() => {
    return categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a[sort].localeCompare(b[sort]));
  }, [categories, search, sort]);

  return (
    <div className="forum-page">
      <div className="forum-header">
        <div>
          <h1 className="forum-title">Community Forums</h1>
          <p className="forum-subtitle">
            Engage with the community, ask questions, share experiences.
          </p>
        </div>
        <div className="forum-actions">
          <button
            className="btn-secondary"
            onClick={doRefresh}
            disabled={refreshing}
          >
            <ArrowPathIcon
              className={"icon-spin " + (refreshing ? "spinning" : "")}
            />
            Refresh
          </button>
          <button className="btn-primary" disabled>
            <PlusIcon className="icon" /> New Category
          </button>
        </div>
      </div>
      <div className="forum-toolbar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sort-box">
          <label>Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name A-Z</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="cards-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="card category-card"
              onClick={() => navigate(`/forums/categories/${cat._id}/threads`)}
            >
              <div className="card-header">
                <h2>{cat.name}</h2>
              </div>
              <p className="card-desc">{cat.description}</p>
              <div className="card-meta">
                <span>
                  Created {new Date(cat.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No categories match your search.</p>
              <button className="btn-secondary" onClick={() => setSearch("")}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
