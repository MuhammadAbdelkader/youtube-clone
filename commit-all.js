const { execSync } = require('child_process');
const path = require('path');

const filesToCommit = [
  { file: 'LICENSE', msg: 'Project licensing and legal attributions' },
  { file: 'README.md', msg: 'Comprehensive project documentation and setup guides' },
  { file: 'client/src/Components/navbar/navbar.html', msg: 'HTML template structure for the main navigation bar' },
  { file: 'client/src/Components/navbar/navbar.css', msg: 'Styling for the main navigation bar and user avatar container' },
  { file: 'client/src/Components/navbar/navbar.ts', msg: 'Component logic and state management for the navigation bar' },
  { file: 'client/src/Components/sidebar/sidebar.html', msg: 'HTML template structure for the application sidebar navigation' },
  { file: 'client/src/app/Pages/channel/channel.html', msg: 'HTML template for the channel profile view and data display' },
  { file: 'client/src/app/Pages/channel/channel.css', msg: 'Styling and layout definitions for the channel profile page' },
  { file: 'client/src/app/Pages/channel/channel.ts', msg: 'Component logic for handling channel profile data and user interactions' },
  { file: 'client/src/app/Pages/explore/explore.css', msg: 'Styling and responsive grid layout for the explore page' },
  { file: 'client/src/app/Pages/explore/explore.html', msg: 'HTML template structure for the trending videos explore grid' },
  { file: 'client/src/app/Pages/explore/explore.ts', msg: 'Component logic for fetching and displaying trending videos' },
  { file: 'client/src/app/Pages/history/history.css', msg: 'Styling and grid layout for the user watch history page' },
  { file: 'client/src/app/Pages/history/history.html', msg: 'HTML template structure for displaying the user watch history feed' },
  { file: 'client/src/app/Pages/history/history.ts', msg: 'Component logic for tracking and managing the user watch history' },
  { file: 'client/src/app/Pages/home/home.css', msg: 'Cascading style sheets for the application landing page' },
  { file: 'client/src/app/Pages/home/home.html', msg: 'HTML structure for the modern presentation landing page' },
  { file: 'client/src/app/Pages/login/login.ts', msg: 'Authentication flows and error handling logic for user login' },
  { file: 'client/src/app/Pages/main/main.css', msg: 'Responsive CSS grid and layout for the main video feed' },
  { file: 'client/src/app/Pages/main/main.html', msg: 'HTML template for the main feed including skeleton loaders and video cards' },
  { file: 'client/src/app/Pages/main/main.ts', msg: 'Component controller for handling main feed video data streams' },
  { file: 'client/src/app/Pages/profile/profile.css', msg: 'Styling and container alignment for the user profile page' },
  { file: 'client/src/app/Pages/profile/profile.html', msg: 'HTML template for the user settings form and profile view' },
  { file: 'client/src/app/Pages/profile/profile.ts', msg: 'Component controller for managing user data mutations and profile updates' },
  { file: 'client/src/app/Pages/register/register.ts', msg: 'Component logic and validation schemas for user registration' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.html', msg: 'HTML template structure for the user subscriptions feed' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.ts', msg: 'Component logic for fetching and rendering subscribed channels content' },
  { file: 'client/src/app/Pages/video-details/video-details.css', msg: 'Custom tag styles and responsive layout for the video details page' },
  { file: 'client/src/app/Pages/video-details/video-details.html', msg: 'HTML template for video playback, metadata, and user interactions' },
  { file: 'client/src/app/Pages/video-details/video-details.ts', msg: 'Component controller handling video streaming, likes, comments, and sharing' },
  { file: 'client/src/app/app.config.ts', msg: 'Core configuration settings for the Angular application' },
  { file: 'client/src/app/app.routes.ts', msg: 'Application routing architecture and navigation path definitions' },
  { file: 'client/src/app/components/avatar/avatar.component.ts', msg: 'UI component and styling logic for user profile avatars' },
  { file: 'client/src/app/components/video-menu/video-menu.css', msg: 'Styling definitions for the interactive video options menu dropdown' },
  { file: 'client/src/app/components/video-menu/video-menu.html', msg: 'HTML template structure for the video options menu dropdown' },
  { file: 'client/src/app/components/video-menu/video-menu.ts', msg: 'Component logic for the video options menu and sharing functionality' },
  { file: 'client/src/app/pipes/cloudinary.pipe.ts', msg: 'Image transformation pipe for robust Cloudinary asset handling' },
  { file: 'client/src/app/pipes/duration.pipe.ts', msg: 'String formatting pipe for human-readable video durations' },
  { file: 'client/src/app/services/auth.ts', msg: 'Authentication service with strict typing and user state management' },
  { file: 'client/src/app/services/config.service.ts', msg: 'Application configuration service for dynamic environment variables' },
  { file: 'client/src/app/services/history.service.ts', msg: 'Service layer for interacting with the watch history backend endpoints' },
  { file: 'client/src/app/services/video.service.ts', msg: 'Service layer enforcing strict API response typing for video data' },
  { file: 'client/src/styles.css', msg: 'Global design system tokens and foundational CSS variables' },
  { file: 'docs/testing.md', msg: 'Comprehensive testing documentation and architecture guidelines' },
  { file: 'docs/backend.md', msg: 'Backend architecture documentation and API schema definitions' },
  { file: 'docs/frontend.md', msg: 'Frontend architecture documentation and state management overview' },
  { file: 'server/app.js', msg: 'Express application middleware configuration and CORS policies' },
  { file: 'server/config/redis.js', msg: 'Redis cache connection logic and service logging integration' },
  { file: 'server/controllers/auth.controller.js', msg: 'Authentication controller with strict JSDoc types and request schemas' },
  { file: 'server/controllers/channel.controller.js', msg: 'Channel controller handling data mutation and retrieval endpoints' },
  { file: 'server/controllers/video.controller.js', msg: 'Video controller equipped with typed JSDoc and caching layers' },
  { file: 'server/models/channel.model.js', msg: 'Mongoose schema and validation rules for Channel entities' },
  { file: 'server/models/user.model.js', msg: 'Mongoose schema and authentication methods for User entities' },
  { file: 'server/models/video.model.js', msg: 'Mongoose schema and indexing configurations for Video entities' },
  { file: 'server/routes/video.routes.js', msg: 'Router endpoint definitions for the video API service' },
  { file: 'server/server.js', msg: 'Server initialization script containing logging and environment validation' },
  { file: 'server/utils/avatar.utils.js', msg: 'Backend utilities for dynamic avatar generation and processing' },
  { file: 'server/utils/resend.utils.js', msg: 'Email utility configurations and standardized logging systems' },
  { file: 'server/validators/video.validator.js', msg: 'Validation schemas ensuring data integrity for multiple ID formats' }
];

const deletedFiles = [
  { file: 'drop-index.js', msg: 'Obsolete database index migration script' },
  { file: 'server/fix-google-id-migration.js', msg: 'Obsolete Google ID migration script' },
  { file: 'server/test_db.js', msg: 'Obsolete database connection testing script' },
  { file: 'server/test_upload.js', msg: 'Obsolete file upload testing script' },
  { file: 'server/test_validator.js', msg: 'Obsolete API validation testing script' }
];

try {
  for (const item of filesToCommit) {
    console.log(`Committing ${item.file}...`);
    try {
      execSync(`git add "${item.file}"`);
      execSync(`git commit -m "${item.msg}"`);
    } catch (e) {
      console.warn(`Warning: Could not commit ${item.file}. It might not have any changes.`);
    }
  }
  for (const item of deletedFiles) {
    console.log(`Committing deletion of ${item.file}...`);
    try {
      execSync(`git rm "${item.file}"`);
      execSync(`git commit -m "${item.msg}"`);
    } catch (e) {
      console.warn(`Warning: Could not remove/commit ${item.file}. It might already be removed.`);
    }
  }
  console.log("All files committed successfully.");
} catch (error) {
  console.error("Error during commit process:");
  console.error(error.stdout ? error.stdout.toString() : error.message);
}
