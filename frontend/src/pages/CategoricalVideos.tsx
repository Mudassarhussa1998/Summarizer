import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, CardMedia, CardActionArea, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getCategoricalVideos, searchCategoricalVideos, deleteCategoricalVideo } from '../api/youtubeApi';
import { CategoricalVideoData } from '../api/youtubeApi';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
// import { useSnackbar } from 'notistack';

const CategoricalVideos: React.FC = () => {
  const [videos, setVideos] = useState<CategoricalVideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const navigate = useNavigate();
  // const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await getCategoricalVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      alert('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchVideos();
      return;
    }

    try {
      setSearching(true);
      const results = await searchCategoricalVideos(searchQuery);
      setVideos(results);
    } catch (error) {
      console.error('Error searching videos:', error);
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchVideos();
  };

  const handleCardClick = (videoId: string) => {
    navigate(`/categorical-video/${videoId}`);
  };

  const handleDeleteVideo = async (event: React.MouseEvent<HTMLButtonElement>, videoId: string) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteCategoricalVideo(videoId);
        alert('Video deleted successfully');
        fetchVideos();
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Failed to delete video');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Videos
        </Typography>

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search videos by title, description or transcript content"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={handleSearch} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading || searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : videos.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ mt: 4 }}>
            {searchQuery ? 'No videos found matching your search.' : 'No videos available.'}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.video_id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <CardActionArea onClick={() => handleCardClick(video.video_id)}>
                    <CardMedia
                      component="div"
                      sx={{
                        height: 0,
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {video.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Duration: {video.duration_formatted}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {video.description || 'No description available'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteVideo(e, video.video_id)}
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default CategoricalVideos;