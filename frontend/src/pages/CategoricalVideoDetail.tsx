import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoricalVideoById, deleteCategoricalVideo } from "../api/youtubeApi";
import { CategoricalVideoData } from "../api/youtubeApi";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

const CategoricalVideoDetail: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = videoId || "";
  const [video, setVideo] = useState<CategoricalVideoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo(id);
    }
  }, [id]);

  const fetchVideo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoricalVideoById(id);
      setVideo(data);
    } catch (error) {
      console.error("Error fetching video:", error);
      setError("Failed to load video details");
      alert("Failed to load video details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      await deleteCategoricalVideo(id);
      alert("Video deleted successfully");
      navigate("/categorical-videos");
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
    }
  };

  const handleBack = () => {
    navigate("/categorical-videos");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h2 className="text-xl text-red-500 mb-4">{error || "Video not found"}</h2>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ArrowBackIcon className="w-5 h-5" />
          Back to Videos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded-lg">
      {/* Top Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ArrowBackIcon className="w-5 h-5" />
          Back to Videos
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <DeleteIcon className="w-5 h-5" />
          Delete Video
        </button>
      </div>

      {/* Video Details */}
      <h1 className="text-2xl font-bold mb-2">{video.name}</h1>
      <div className="mb-4 text-gray-700 space-y-1">
        <p>Duration: {video.duration_formatted}</p>
        <p>
          Source: {video.source_type} ({video.source_id})
        </p>
        <p>
          Words: {video.word_count} | Characters: {video.character_count}
        </p>
      </div>

      {/* Description */}
      {video.description && (
        <div className="bg-gray-50 p-4 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="whitespace-pre-wrap">{video.description}</p>
        </div>
      )}

      <hr className="my-4" />

      {/* Transcript */}
      <h2 className="text-xl font-semibold mb-2">Transcript</h2>
      <div className="bg-gray-50 p-4 rounded shadow">
        <p className="whitespace-pre-wrap">
          {video.transcript || "No transcript available"}
        </p>
      </div>

      {/* External Link */}
      <div className="mt-6">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Original Source
        </a>
      </div>
    </div>
  );
};

export default CategoricalVideoDetail;
