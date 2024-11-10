import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Paper, 
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import { 
    MoreVert,
    Search,
    FilterList,
    GetApp,
    Visibility
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { uploadApi, UploadResponse } from '@/lib/api/uploads';
import { UPLOAD_STATUS, FileCategory, UploadStatus } from '@/UploadingSystem/constants/uploadConstants';
import { formatBytes } from '../../../utils/formatters';
import { formatDate } from '@/components/Resources/utils/dateUtils';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import io from 'socket.io-client';

export interface UploadHistoryRecord {
    id: string;
    trackingId: string;
    userId: string;
    tenantId: string;
    status: UploadStatus;
    lastModified: Date;
    createdAt: Date;
    completedAt?: Date;
    fileUrl?: string;
    duration?: number;
    processingSteps?: string[];
    metadata?: {
        originalName: string;
        fileSize: number;
        category: FileCategory;
        uploadedAt: Date;
    };
}

interface UploadHistoryProps {
    userId: string;
    onViewUpload?: (trackingId: string) => void;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
    userId,
    onViewUpload
}) => {
    const router = useRouter();
    const [uploads, setUploads] = useState<UploadResponse[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUploads, setTotalUploads] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUpload, setSelectedUpload] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUploads = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await uploadApi.getUploadHistory(page + 1, rowsPerPage, { status: undefined, userId });
            setUploads(response.items);
            setTotalUploads(response.totalItems);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch upload history';
            setError(errorMessage);
            messageHandler.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, [page, rowsPerPage, userId]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'); // Replace with your socket server URL

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('uploadHistoryUpdate', (updatedUpload: UploadResponse) => {
            setUploads((prevUploads) => {
                const index = prevUploads.findIndex(upload => upload.trackingId === updatedUpload.trackingId);
                if (index !== -1) {
                    const newUploads = [...prevUploads];
                    newUploads[index] = updatedUpload;
                    return newUploads;
                }
                return prevUploads;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, trackingId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedUpload(trackingId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUpload(null);
    };

    const handleViewUpload = (trackingId: string) => {
        if (onViewUpload) {
            onViewUpload(trackingId);
        } else {
            router.push(`/upload/visualization?trackingId=${trackingId}`);
        }
        handleMenuClose();
    };

    const handleDownload = async (trackingId: string) => {
        try {
            const blob = await uploadApi.downloadFile(trackingId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = uploads.find(u => u.trackingId === trackingId)?.metadata?.originalName || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            messageHandler.error('Failed to download file');
        }
    };

    const getStatusColor = (status: UploadStatus) => {
        switch (status) {
            case UPLOAD_STATUS.COMPLETED:
                return 'success';
            case UPLOAD_STATUS.FAILED:
                return 'error';
            case UPLOAD_STATUS.UPLOADING:
            case UPLOAD_STATUS.PROCESSING:
                return 'info';
            case UPLOAD_STATUS.PAUSED:
                return 'warning';
            default:
                return 'default';
        }
    };

    const filteredUploads = uploads.filter(upload => 
        upload.metadata?.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Paper elevation={3} className="p-6">
                <Box className="flex justify-center items-center h-64">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper elevation={3} className="p-6">
                <Alert severity="error" className="mb-4">
                    {error}
                </Alert>
            </Paper>
        );
    }

    if (!uploads.length) {
        return (
            <Paper elevation={3} className="p-6">
                <Box className="flex flex-col justify-center items-center h-64">
                    <Typography variant="h6" color="textSecondary">
                        No uploads found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Start uploading files to see them here
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} className="p-6">
            <Box className="flex justify-between items-center mb-6">
                <Typography variant="h6">Upload History</Typography>
                <Box className="flex items-center space-x-4">
                    <TextField
                        size="small"
                        placeholder="Search uploads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box>
                        <Chip
                            icon={<FilterList />}
                            label={'All Status'}
                            onClick={() => {/* Add filter menu */}}
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>File Name</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Uploaded</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUploads.map((upload) => (
                            <TableRow key={upload.trackingId}>
                                <TableCell>{upload.metadata?.originalName}</TableCell>
                                <TableCell>{formatBytes(upload.metadata?.fileSize || 0)}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={upload.metadata?.category} 
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={upload.status}
                                        color={getStatusColor(upload.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {formatDate(upload.metadata?.uploadedAt)}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, upload.trackingId)}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={totalUploads}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => selectedUpload && handleViewUpload(selectedUpload)}>
                    <Visibility className="mr-2" /> View Progress
                </MenuItem>
                <MenuItem onClick={() => selectedUpload && handleDownload(selectedUpload)}>
                    <GetApp className="mr-2" /> Download
                </MenuItem>
            </Menu>
        </Paper>
    );
};
