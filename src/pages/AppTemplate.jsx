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

const darkTheme = createTheme({
    // ... [previous theme configuration remains the same]
});

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
    const [apiResponse, setApiResponse] = useState(null);

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
            // Remove the data:image/[type];base64, prefix from the base64 string
            const base64String = reader.result.split(',')[1];
            setFormData(prev => ({
                ...prev,
                file: file,
                base64Image: base64String // Store only the base64 data without the prefix
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
        setApiResponse(null);

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
                image: formData.base64Image // Send only the base64 data without the prefix
            };

            console.log('Sending request to:', API_URL);
            console.log('Payload:', {
                height: payload.height,
                width: payload.width,
                image: 'base64_string_here...' // Log truncated for readability
            });

            // Make API call
            const response = await axios.post(API_URL, payload);

            console.log('Full API Response:', response);
            setApiResponse(response.data);

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
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Image Resizer
                        </Typography>
                        <IconButton
                            size="large"
                            edge="end"
                            color="inherit"
                            aria-label="menu"
                        >
                            <MenuIcon />
                        </IconButton>
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

                    {/* Response Preview */}
                    {apiResponse && (
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                mt: 3,
                                backgroundColor: 'background.paper',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 2 }}>API Response:</Typography>
                            <pre style={{
                                overflow: 'auto',
                                maxHeight: '200px',
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                padding: '1rem',
                                borderRadius: '4px'
                            }}>
                                {JSON.stringify(apiResponse, null, 2)}
                            </pre>
                        </Paper>
                    )}
                </Container>

                {/* Snackbar for submission feedback */}
                <Snackbar
                    open={submitStatus.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={submitStatus.severity}
                        sx={{ width: '100%' }}
                    >
                        {submitStatus.message}
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
};

export default AppTemplate;