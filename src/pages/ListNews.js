import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BASE_API_URL from "../utils/apiConfig";

const NewsList = () => {
  const [news, setNews] = useState([]);

  // Fetch all news articles
  useEffect(() => {
    fetch(`${BASE_API_URL}/api/articles`)
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch((error) => console.error("Error fetching news:", error));
  }, []);

  // Delete a news article
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this news?")) {
      try {
        const response = await fetch(`${BASE_API_URL}/api/articles/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setNews(news.filter((article) => article._id !== id));
          alert("News deleted successfully!");
        } else {
          alert("Failed to delete news.");
        }
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  return (
    <div>
      <h1>News List</h1>
      <Link to="/add-news">Add New News</Link>
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
<table border="1" style={{ width: '100%', minWidth: '800px' }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {news.map((article) => (
            <tr key={article._id}>
              <td>{article.title}</td>
              <td>{article.author}</td>
              <td>{new Date(article.date).toLocaleDateString()}</td>
              <td>
                <Link to={`/edit-news/${article._id}`}>Edit</Link>
                <button onClick={() => handleDelete(article._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
    </div>
  );
};

export default NewsList;
