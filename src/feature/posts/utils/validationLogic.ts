// if (!content || !type) {
//   const missingFields = ['content', 'type'].filter(field => !postData[field]);
//   const appError = monitoringManager.error.createError(
//     'business',
//     'VALIDATION_ERROR',
//     'Missing required fields',
//     { missingFields }
//   );
//   const errorResponse = monitoringManager.error.handleError(appError);
//   return res.status(errorResponse.statusCode).json({
//     error: {
//       message: errorResponse.userMessage,
//       type: 'VALIDATION_ERROR',
//       reference: errorResponse.errorReference,
//       errors: missingFields.map(field => ({
//         field,
//         message: `${field} is required`
//       }))
//     },
//     status: errorResponse.statusCode
//   });
// }

// // Validate content length
// if (typeof content !== 'string' || content.length > 5000) {
//   const appError = monitoringManager.error.createError(
//     'business',
//     'VALIDATION_ERROR',
//     'Content must be a valid string and not exceed 5000 characters',
//     { contentLength: content?.length }
//   );
//   const errorResponse = monitoringManager.error.handleError(appError);
//   return res.status(errorResponse.statusCode).json({
//     error: {
//       message: errorResponse.userMessage,
//       type: 'VALIDATION_ERROR',
//       reference: errorResponse.errorReference,
//       errors: [{
//         field: 'content',
//         message: 'Content must be a valid string and not exceed 5000 characters'
//       }]
//     },
//     status: errorResponse.statusCode
//   });
// }

// // Validate post type
// const validTypes = ['TEXT', 'PHOTO', 'VIDEO', 'MOOD', 'SURVEY'];
// const normalizedType = type.toUpperCase();
// if (!validTypes.includes(normalizedType)) {
//   const appError = monitoringManager.error.createError(
//     'business',
//     'VALIDATION_ERROR',
//     'Invalid post type',
//     { validTypes, providedType: type }
//   );
//   const errorResponse = monitoringManager.error.handleError(appError);
//   return res.status(errorResponse.statusCode).json({
//     error: {
//       message: errorResponse.userMessage,
//       type: 'VALIDATION_ERROR',
//       reference: errorResponse.errorReference,
//       errors: [{
//         field: 'type',
//         message: `Post type must be one of: ${validTypes.join(', ')}`
//       }]
//     },
//     status: errorResponse.statusCode
//   });
// }

// // Validate media if present
// if (media) {
//   // For PHOTO posts
//   if (normalizedType === 'PHOTO') {
//     if (!Array.isArray(media.urls) || media.urls.length === 0) {
//       const appError = monitoringManager.error.createError(
//         'business',
//         'VALIDATION_ERROR',
//         'Photo post requires at least one image URL',
//         { mediaUrls: media.urls }
//       );
//       const errorResponse = monitoringManager.error.handleError(appError);
//       return res.status(errorResponse.statusCode).json({
//         error: {
//           message: errorResponse.userMessage,
//           type: 'VALIDATION_ERROR',
//           reference: errorResponse.errorReference,
//           errors: [{
//             field: 'media.urls',
//             message: 'Photo post requires at least one image URL'
//           }]
//         },
//         status: errorResponse.statusCode
//       });
//     }

//     // Validate image URLs
//     const invalidUrls = media.urls.filter(url => {
//       try {
//         new URL(url);
//         return false;
//       } catch {
//         return true;
//       }
//     });

//     if (invalidUrls.length > 0) {
//       const appError = monitoringManager.error.createError(
//         'business',
//         'VALIDATION_ERROR',
//         'Invalid image URLs provided',
//         { invalidUrls }
//       );
//       const errorResponse = monitoringManager.error.handleError(appError);
//       return res.status(errorResponse.statusCode).json({
//         error: {
//           message: errorResponse.userMessage,
//           type: 'VALIDATION_ERROR',
//           reference: errorResponse.errorReference,
//           errors: invalidUrls.map(url => ({
//             field: 'media.urls',
//             message: `Invalid URL format: ${url}`
//           }))
//         },
//         status: errorResponse.statusCode
//       });
//     }
//   }

//   // For VIDEO posts
//   if (normalizedType === 'VIDEO') {
//     if (!media.urls?.[0]) {
//       const appError = monitoringManager.error.createError(
//         'business',
//         'VALIDATION_ERROR',
//         'Video post requires a video URL',
//         { mediaUrls: media.urls }
//       );
//       const errorResponse = monitoringManager.error.handleError(appError);
//       return res.status(errorResponse.statusCode).json({
//         error: {
//           message: errorResponse.userMessage,
//           type: 'VALIDATION_ERROR',
//           reference: errorResponse.errorReference,
//           errors: [{
//             field: 'media.urls',
//             message: 'Video post requires a video URL'
//           }]
//         },
//         status: errorResponse.statusCode
//       });
//     }

//     // Validate video URL
//     try {
//       new URL(media.urls[0]);
//     } catch {
//       const appError = monitoringManager.error.createError(
//         'business',
//         'VALIDATION_ERROR',
//         'Invalid video URL provided',
//         { videoUrl: media.urls[0] }
//       );
//       const errorResponse = monitoringManager.error.handleError(appError);
//       return res.status(errorResponse.statusCode).json({
//         error: {
//           message: errorResponse.userMessage,
//           type: 'VALIDATION_ERROR',
//           reference: errorResponse.errorReference,
//           errors: [{
//             field: 'media.urls',
//             message: 'Invalid video URL format'
//           }]
//         },
//         status: errorResponse.statusCode
//       });
//     }
//   }

//   // Validate file sizes if files are present
//   if (media.files) {
//     const maxFileSize = 10 * 1024 * 1024; // 10MB
//     const oversizedFiles = Object.entries(media.files).filter(
//       ([_, file]) => (file as any).size > maxFileSize
//     );

//     if (oversizedFiles.length > 0) {
//       const appError = monitoringManager.error.createError(
//         'business',
//         'VALIDATION_ERROR',
//         'File size exceeds limit',
//         { oversizedFiles: oversizedFiles.map(([name]) => name) }
//       );
//       const errorResponse = monitoringManager.error.handleError(appError);
//       return res.status(errorResponse.statusCode).json({
//         error: {
//           message: errorResponse.userMessage,
//           type: 'VALIDATION_ERROR',
//           reference: errorResponse.errorReference,
//           errors: oversizedFiles.map(([name]) => ({
//             field: `media.files.${name}`,
//             message: 'File size must not exceed 10MB'
//           }))
//         },
//         status: errorResponse.statusCode
//       });
//     }
//   }
// }

// // Additional metadata validation (if needed)
// if (postData.metadata) {
//   // Validate metadata structure based on post type
//   const metadataValidation = validateMetadataForType(normalizedType, postData.metadata);
//   if (!metadataValidation.isValid) {
//     const appError = monitoringManager.error.createError(
//       'business',
//       'VALIDATION_ERROR',
//       'Invalid metadata for post type',
//       { 
//         type: normalizedType, 
//         errors: metadataValidation.errors 
//       }
//     );
//     const errorResponse = monitoringManager.error.handleError(appError);
//     return res.status(errorResponse.statusCode).json({
//       error: {
//         message: errorResponse.userMessage,
//         type: 'VALIDATION_ERROR',
//         reference: errorResponse.errorReference,
//         errors: metadataValidation.errors.map(error => ({
//           field: `metadata.${error.field}`,
//           message: error.message
//         }))
//       },
//       status: errorResponse.statusCode
//     });
//   }
// }

// // Helper function for metadata validation
// function validateMetadataForType(type: string, metadata: any): { 
//   isValid: boolean; 
//   errors: Array<{ field: string; message: string }> 
// } {
//   const errors = [];

//   switch (type) {
//     case 'MOOD':
//       if (!metadata.mood || typeof metadata.mood !== 'string') {
//         errors.push({
//           field: 'mood',
//           message: 'Mood value is required and must be a string'
//         });
//       }
//       if (metadata.intensity && typeof metadata.intensity !== 'number') {
//         errors.push({
//           field: 'intensity',
//           message: 'Mood intensity must be a number'
//         });
//       }
//       break;

//     case 'SURVEY':
//       if (!Array.isArray(metadata.options) || metadata.options.length < 2) {
//         errors.push({
//           field: 'options',
//           message: 'Survey must have at least 2 options'
//         });
//       }
//       if (metadata.duration && typeof metadata.duration !== 'number') {
//         errors.push({
//           field: 'duration',
//           message: 'Survey duration must be a number'
//         });
//       }
//       break;

//     // Add more cases for other post types as needed
//   }

//   return {
//     isValid: errors.length === 0,
//     errors
//   };
// }