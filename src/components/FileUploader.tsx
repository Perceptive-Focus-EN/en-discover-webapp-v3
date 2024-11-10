// import React, { useEffect, useState, useCallback } from 'react';
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { 
//   Box, 
//   Card, 
//   CardHeader, 
//   CardContent,
//   LinearProgress,
//   Grid,
//   Typography,
//   IconButton,
//   Alert,
  
// } from '@mui/material';
// import { UploadState } from '@/UploadingSystem/types/state';
// import { Play, Pause, RotateCcw, X, Shield, AlertTriangle } from 'lucide-react';

// interface MonitoredFileUploaderProps {
//   userId: string;
//   tenantId: string;
//   onProgress?: (progress: number) => void;
//   onComplete?: () => void;
//   onError?: (error: Error) => void;
// }

// export const MonitoredFileUploader: React.FC<MonitoredFileUploaderProps> = ({
//   userId,
//   tenantId,
//   onProgress,
//   onComplete,
//   onError
// }) => {
//   const [uploadId, setUploadId] = useState<string | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadMetrics, setUploadMetrics] = useState({
//     progress: 0,
//     speed: 0,
//     memoryUsage: 0,
//     queuePosition: 0,
//     securityStatus: 'secure',
//     activeThreats: 0
//   });

//   // Setup real-time monitoring subscription
//   useEffect(() => {
//     if (!uploadId) return;



//     const subscription = monitoringManager.metrics.subscribe(
//         'upload_system',
//         (metric: Metric) => {
//             if (metric.metadata?.trackingId === uploadId) {
//                 setUploadMetrics(prev => ({
//                     ...prev,
//                     progress: metric.metadata?.uploadStats?.chunkProgress || 0,
//                     speed: metric.metadata?.uploadStats?.uploadSpeed || 0,
//                     memoryUsage: metric.metadata?.uploadStats?.memoryUsage || 0,
//                     queuePosition: metric.metadata?.uploadStats?.queueSize || 0
//                 }));

//                 onProgress?.(metric.metadata?.uploadStats?.chunkProgress || 0);
//             }
//         },
//         {
//             component: 'upload_system',
//             isDashboardMetric: true
//         }
//     );

//     const securitySubscription = monitoringManager.metrics.subscribe(
//       'upload_security',
//       (metric) => {
//         if (metric.metadata?.trackingId === uploadId) {
//           setUploadMetrics(prev => ({
//             ...prev,
//             securityStatus: metric.metadata?.securityStatus || 'secure',
//             activeThreats: metric.metadata?.activeThreats || 0
//           }));
//         }
//       },
//       {
//         component: 'upload_security',
//         isDashboardMetric: true
//       }
//     );

//     return () => {
//       subscription.unsubscribe();
//       securitySubscription.unsubscribe();
//     };
//   }, [uploadId, onProgress]);

//   const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       // Record upload start metric
//       monitoringManager.recordDashboardMetric({
//         type: 'SYSTEM_HEALTH',
//         timestamp: Date.now(),
//         value: 1,
//         metadata: {
//           component: 'upload_system',
//           category: 'file_upload',
//           aggregationType: 'sum',
//           uploadStats: {
//             activeUploads: 1,
//             fileSize: file.size,
//             fileType: file.type
//           }
//         }
//       });

//       const response = await fetch('/api/uploads/enhancedSecurityUpload', {
//         method: 'POST',
//         body: formData,
//       });
//       const data = await response.json();
//       setUploadId(data.trackingId);
//     } catch (error) {
//       onError?.(error as Error);
//       setIsUploading(false);
//     }
//   };

//   const handleControlAction = async (action: 'pause' | 'resume' | 'retry' | 'cancel') => {
//     if (!uploadId) return;

//     try {
//       await fetch(`/api/uploads/${uploadId}/${action}`, { method: 'POST' });
      
//       // Record control action metric
//       monitoringManager.recordDashboardMetric({
//         type: 'SYSTEM_HEALTH',
//         timestamp: Date.now(),
//         value: 1,
//         metadata: {
//           component: 'upload_system',
//           category: 'control_action',
//           aggregationType: 'sum',
//           uploadStats: {
//             action,
//             trackingId: uploadId
//           }
//         }
//       });
//     } catch (error) {
//       onError?.(error as Error);
//     }
//   };

//   return (
//     <Card className="w-full">
//       <CardHeader title="Secure File Upload" />
//       <CardContent>
//         <Grid container spacing={2}>
//           {/* File Input */}
//           <Grid item xs={12}>
//             <Box className="border-2 border-dashed rounded-lg p-4 text-center">
//               <input
//                 type="file"
//                 onChange={handleFileSelect}
//                 disabled={isUploading}
//                 className="hidden"
//                 id="file-upload"
//               />
//               <label
//                 htmlFor="file-upload"
//                 className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
//               >
//                 <Box className="flex flex-col items-center">
//                   <Upload className="h-8 w-8 mb-2" />
//                   <Typography>
//                     {isUploading ? 'Upload in progress...' : 'Click to upload or drag and drop'}
//                   </Typography>
//                 </Box>
//               </label>
//             </Box>
//           </Grid>

//           {/* Upload Progress */}
//           {uploadId && (
//             <>
//               <Grid item xs={12}>
//                 <Box className="space-y-2">
//                   <Typography variant="subtitle2">Upload Progress</Typography>
//                   <LinearProgress
//                     variant="determinate"
//                     value={uploadMetrics.progress}
//                     className="h-2 rounded"
//                   />
//                   <Box className="flex justify-between text-sm">
//                     <span>{uploadMetrics.progress.toFixed(1)}%</span>
//                     <span>{(uploadMetrics.speed / 1024 / 1024).toFixed(2)} MB/s</span>
//                   </Box>
//                 </Box>
//               </Grid>

//               {/* Control Buttons */}
//               <Grid item xs={12}>
//                 <Box className="flex space-x-2 justify-center">
//                   <IconButton 
//                     onClick={() => handleControlAction(isUploading ? 'pause' : 'resume')}
//                     size="small"
//                   >
//                     {isUploading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
//                   </IconButton>
//                   <IconButton 
//                     onClick={() => handleControlAction('retry')}
//                     size="small"
//                   >
//                     <RotateCcw className="h-4 w-4" />
//                   </IconButton>
//                   <IconButton 
//                     onClick={() => handleControlAction('cancel')}
//                     size="small"
//                   >
//                     <X className="h-4 w-4" />
//                   </IconButton>
//                 </Box>
//               </Grid>

//               {/* Security Status */}
//               <Grid item xs={12}>
//                 {uploadMetrics.securityStatus !== 'secure' && (
//                   <Alert variant="destructive">
//                     <AlertTriangle className="h-4 w-4" />
//                     <AlertDescription>
//                       Security check in progress. Active threats detected: {uploadMetrics.activeThreats}
//                     </AlertDescription>
//                   </Alert>
//                 )}
//               </Grid>

//               {/* Resource Usage */}
//               <Grid item xs={12}>
//                 <Box className="space-y-2">
//                   <Typography variant="subtitle2">Resource Usage</Typography>
//                   <LinearProgress
//                     variant="determinate"
//                     value={(uploadMetrics.memoryUsage / 1024 / 1024 / 1024) * 100}
//                     color={uploadMetrics.memoryUsage > 1024 * 1024 * 1024 ? "warning" : "primary"}
//                     className="h-2 rounded"
//                   />
//                   <Typography variant="caption">
//                     Memory: {Math.round(uploadMetrics.memoryUsage / 1024 / 1024)}MB
//                   </Typography>
//                 </Box>
//               </Grid>
//             </>
//           )}
//         </Grid>
//       </CardContent>
//     </Card>
//   );
// };