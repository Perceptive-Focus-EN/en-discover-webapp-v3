import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  Modal, Box, Typography, Button, IconButton,
  LinearProgress, List, ListItem, ListItemIcon,
  ListItemText, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, InsertDriveFile, CheckCircleOutline, Close } from '@mui/icons-material';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 500,
  maxHeight: '80vh',
  overflow: 'auto',
}));

const DropzoneArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FileUploadModal: React.FC<FileUploadModalProps> = ({ open, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file); // Important: use the correct field name ('file')
    });

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            files.forEach(file => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }));
            });
          }
        },
      });
      console.log('Upload response:', response.data);
      // Handle successful upload (e.g., show success message, clear files)
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle upload failure (e.g., show error message)
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  return (
    <StyledModal open={open} onClose={onClose}>
      <ModalContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Upload Files for Analysis</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <DropzoneArea {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography>Drop the files here ...</Typography>
          ) : (
            <Typography>Drag &apos;n&apos; drop some files here, or click to select files</Typography>
          )}
          <CloudUpload sx={{ fontSize: 48, mt: 2, color: 'primary.main' }} />
        </DropzoneArea>
        <List>
          {files.map((file, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <InsertDriveFile />
              </ListItemIcon>
              <ListItemText primary={file.name} secondary={`${file.size} bytes`} />
              {uploadProgress[file.name] !== undefined && (
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress[file.name]} />
                </Box>
              )}
              {uploadProgress[file.name] === 100 ? (
                <Tooltip title="Upload complete">
                  <CheckCircleOutline color="success" />
                </Tooltip>
              ) : (
                <Tooltip title="Remove file">
                  <IconButton onClick={() => removeFile(file)} size="small">
                    <Close />
                  </IconButton>
                </Tooltip>
              )}
            </ListItem>
          ))}
        </List>
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            startIcon={<CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </Box>
      </ModalContent>
    </StyledModal>
  );
};

export default FileUploadModal;
