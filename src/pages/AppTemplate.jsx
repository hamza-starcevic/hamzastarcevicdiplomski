import React, { useState } from 'react';
import axios from 'axios';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Paper,
    TextField,
    Button,
    Box,
    IconButton,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Alert,
    CircularProgress,
    Snackbar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

const mentholTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00FF9F', // Bright menthol
            light: '#66FFB2', // Lighter menthol
            dark: '#00B36B', // Darker menthol
            contrastText: '#000000',
        },
        secondary: {
            main: '#1A1A1A', // Dark gray
            light: '#333333',
            dark: '#000000',
        },
        background: {
            default: '#0A0A0A', // Near black
            paper: '#141414', // Slightly lighter black
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B3B3B3',
        },
        success: {
            main: '#00FF9F',
        },
        error: {
            main: '#FF4444',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0, 255, 159, 0.2)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0A0A0A',
                    borderBottom: '1px solid rgba(0, 255, 159, 0.1)',
                },
            },
        },
    },
});

const darkTheme = mentholTheme

const API_URL = 'https://bu30c8d121.execute-api.eu-central-1.amazonaws.com/resize/resize';

const AppTemplate = () => {
    // State for form values
    const [formData, setFormData] = useState({
        height: '',
        width: '',
        file: null,
        base64Image: null
    });

    // State for UI feedback
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ open: false, message: '', severity: 'success' });
    const [downloadUrl, setDownloadUrl] = useState(null);

    // Handle download
    const handleDownload = async (url) => {
        try {
            // Fetch the image with specific headers for S3
            const response = await axios.get(url, {
                responseType: 'arraybuffer',  // Changed from blob to arraybuffer
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                // Ensure cookies and credentials are not sent
                withCredentials: false
            });

            // Create blob from array buffer
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            const downloadUrl = window.URL.createObjectURL(blob);

            // Extract filename from URL (before the query parameters)
            const fileName = url.split('/').pop().split('?')[0] || 'resized-image.jpg';

            // Create and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            // Show success message
            setSubmitStatus({
                open: true,
                message: 'Download started successfully!',
                severity: 'success'
            });

        } catch (error) {
            console.error('Download failed:', error);
            setError('Failed to download the image. The link might have expired.');
            setSubmitStatus({
                open: true,
                message: 'Download failed - the link might have expired',
                severity: 'error'
            });
        }
    };


    // Handle number input changes
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle file upload and conversion to base64
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setError('');

        if (file && !file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            setFormData(prev => ({
                ...prev,
                file: file,
                base64Image: base64String
            }));
        };

        reader.onerror = () => {
            setError('Error reading file');
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSubmitStatus(prev => ({ ...prev, open: false }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDownloadUrl(null);

        // Validate form data
        if (!formData.height || !formData.width) {
            setError('Please fill in both height and width');
            setLoading(false);
            return;
        }

        if (!formData.base64Image) {
            setError('Please upload an image');
            setLoading(false);
            return;
        }
        try {
            // Prepare data for API
            const payload = {
                height: parseInt(formData.height),
                width: parseInt(formData.width),
                image: formData.base64Image
            };

            console.log('Sending request to:', API_URL);
            console.log('Payload:', {
                height: payload.height,
                width: payload.width,
                image: 'base64_string_here...'
            });

            // Make API call
            const response = await axios.post(API_URL, payload);

            console.log('Full API Response:', response);
            setDownloadUrl(response.data.downloadUrl);

            // Show success message
            setSubmitStatus({
                open: true,
                message: 'Image resized successfully!',
                severity: 'success'
            });

        } catch (err) {
            console.error('API Error:', err);
            setError(err.response?.data?.message || 'Error resizing image');
            setSubmitStatus({
                open: true,
                message: 'Error resizing image',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Render download section
    const renderDownloadSection = () => {
        if (!downloadUrl) return null;

        return (
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mt: 3,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <Typography variant="h6" color="primary">
                    Your image has been resized!
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(downloadUrl)}
                    sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1.1rem'
                    }}
                >
                    Download Resized Image
                </Button>
            </Paper>
        );
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: 'background.default',
            }}>
                <AppBar position="relative" elevation={0}>
                    <Toolbar>
                        <Typography color='#00B36B' variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Image Resizer - "Proof of concept" za diplomski rad Hamza Starcevic
                        </Typography>

                    </Toolbar>
                </AppBar>

                <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            backgroundColor: 'background.paper',
                            borderRadius: 2,
                        }}
                    >
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                '& > :not(style)': { mb: 3 },
                                '& .MuiTextField-root': { mb: 3 }
                            }}
                        >
                            <TextField
                                fullWidth
                                type="number"
                                label="Width"
                                variant="outlined"
                                id="width"
                                value={formData.width}
                                onChange={handleInputChange}
                                disabled={loading}
                                inputProps={{ min: 1 }}
                            />

                            <TextField
                                fullWidth
                                type="number"
                                label="Height"
                                variant="outlined"
                                id="height"
                                value={formData.height}
                                onChange={handleInputChange}
                                disabled={loading}
                                inputProps={{ min: 1 }}
                            />

                            <Box sx={{
                                textAlign: 'center',
                                py: 2,
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'primary.main',
                                mb: 3
                            }}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                />
                                <label htmlFor="file-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<CloudUploadIcon />}
                                        sx={{ mb: 1 }}
                                        disabled={loading}
                                    >
                                        Upload Image
                                    </Button>
                                </label>
                                {formData.file && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
                                        Selected: {formData.file.name}
                                    </Typography>
                                )}
                                {error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                            </Box>

                            {formData.base64Image && (
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1, color: 'primary.main' }}>
                                        Preview:
                                    </Typography>
                                    <img
                                        src={`data:image/jpeg;base64,${formData.base64Image}`}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </Box>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Resize Image'
                                )}
                            </Button>
                        </Box>
                    </Paper>

                    {renderDownloadSection()}
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default AppTemplate;