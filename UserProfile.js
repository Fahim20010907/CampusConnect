// src/components/UserProfile.js

import { useState, useEffect } from 'react';
import axios from 'axios';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
        setUser(response.data.data); // Set user data from response
      } catch (err) {
        setError('Error fetching user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <img src={user.profilePicture} alt={user.name} />
      <p>{user.bio}</p>
      <p>Department: {user.department}</p>
      <p>Followers: {user.followerCount}</p>
      <p>Following: {user.followingCount}</p>

      <h3>Posts</h3>
      <ul>
        {user.posts.map((post) => (
          <li key={post._id}>{post.content}</li>
        ))}
      </ul>

      <h3>Resources</h3>
      <ul>
        {user.resources.map((resource) => (
          <li key={resource._id}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              {resource.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserProfile;
