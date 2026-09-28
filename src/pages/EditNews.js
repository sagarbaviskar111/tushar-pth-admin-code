import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BASE_API_URL from "../utils/apiConfig";

const EditNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState({
    title: "",
    content: "",
    author: "",
  });

  useEffect(() => {
    fetch(`${BASE_API_URL}/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch((error) => console.error("Error fetching news:", error));
  }, [id]);

  const handleChange = (e) => {
    setNews({ ...news, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_API_URL}/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(news),
      });

      if (response.ok) {
        alert("News updated successfully!");
        navigate("/");
      } else {
        alert("Failed to update news.");
      }
    } catch (error) {
      console.error("Error updating news:", error);
    }
  };

  return (
    <div>
      <h1>Edit News</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" value={news.title} onChange={handleChange} required />
        <textarea name="content" value={news.content} onChange={handleChange} required></textarea>
        <input type="text" name="author" value={news.author} onChange={handleChange} required />
        <button type="submit">Update News</button>
      </form>
    </div>
  );
};

export default EditNews;
