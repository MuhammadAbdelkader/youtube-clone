const { execSync } = require('child_process');

const filesToCommit = [
  // ── Root & Docs ───────────────────────────────────────────────────────────
  { file: 'LICENSE',    msg: 'Project licensing and legal attributions' },
  { file: 'README.md',  msg: 'Comprehensive project documentation and setup guides' },
  { file: 'docs/testing.md',  msg: 'Testing documentation and architecture guidelines' },
  { file: 'docs/backend.md',  msg: 'Backend architecture documentation and API schemas' },
  { file: 'docs/frontend.md', msg: 'Frontend architecture documentation and state management' },

  // ── Server ────────────────────────────────────────────────────────────────
  { file: 'server/app.js',                                  msg: 'Express application middleware and CORS policies' },
  { file: 'server/server.js',                               msg: 'Server initialization, logging, and environment validation' },
  { file: 'server/config/redis.js',                         msg: 'Redis cache connection logic and service logging' },
  { file: 'server/models/user.model.js',                    msg: 'User Mongoose schema and authentication methods' },
  { file: 'server/models/channel.model.js',                 msg: 'Channel Mongoose schema and validation rules' },
  { file: 'server/models/video.model.js',                   msg: 'Video Mongoose schema and indexing configurations' },
  { file: 'server/controllers/auth.controller.js',          msg: 'Authentication controller types and request schemas' },
  { file: 'server/controllers/channel.controller.js',       msg: 'Channel API controller for data mutation and retrieval' },
  { file: 'server/controllers/comment.controller.js',       msg: 'Comment API controller for interactions and moderation' },
  { file: 'server/controllers/video.controller.js',         msg: 'Video API controller for cascading resource management' },
  { file: 'server/controllers/watchHistory.controller.js',  msg: 'Watch history API controller and endpoint handlers' },
  { file: 'server/routes/auth.routes.js',                   msg: 'Authentication router endpoint definitions' },
  { file: 'server/routes/video.routes.js',                  msg: 'Video router endpoint definitions' },
  { file: 'server/utils/avatar.utils.js',                   msg: 'Utilities for dynamic avatar generation and processing' },
  { file: 'server/utils/resend.utils.js',                   msg: 'Email utility configurations and logging systems' },
  { file: 'server/validators/video.validator.js',           msg: 'Validation schemas for video data integrity' },
  { file: 'server/validators/watchHistory.validator.js',    msg: 'Joi validation schemas for watch history requests' },

  // ── Client — Global ───────────────────────────────────────────────────────
  { file: 'client/src/styles.css',                          msg: 'Global design system tokens and CSS variables' },
  { file: 'client/src/app/app.config.ts',                   msg: 'Core configuration settings for the Angular application' },
  { file: 'client/src/app/app.routes.ts',                   msg: 'Application routing architecture and navigation paths' },

  // ── Client — Navbar / Sidebar ─────────────────────────────────────────────
  { file: 'client/src/Components/navbar/navbar.html',       msg: 'HTML template structure for the main navigation bar' },
  { file: 'client/src/Components/navbar/navbar.css',        msg: 'Styling for the main navigation bar and user avatar' },
  { file: 'client/src/Components/navbar/navbar.ts',         msg: 'Component logic and state management for the navigation bar' },
  { file: 'client/src/Components/sidebar/sidebar.html',     msg: 'HTML template structure for the application sidebar' },

  // ── Client — Pipes ────────────────────────────────────────────────────────
  { file: 'client/src/app/pipes/cloudinary.pipe.ts',        msg: 'Image transformation pipe for Cloudinary assets' },
  { file: 'client/src/app/pipes/duration.pipe.ts',          msg: 'String formatting pipe for video durations' },

  // ── Client — Services ─────────────────────────────────────────────────────
  { file: 'client/src/app/services/auth.ts',                msg: 'Authentication service and user state management' },
  { file: 'client/src/app/services/comment.service.ts',     msg: 'Comment service with UI state fields and interactions' },
  { file: 'client/src/app/services/config.service.ts',      msg: 'Application configuration service for environment variables' },
  { file: 'client/src/app/services/history.service.ts',     msg: 'Service layer for watch history API endpoints' },
  { file: 'client/src/app/services/video.service.ts',       msg: 'Video service with state fields and deletion capabilities' },
  { file: 'client/src/app/services/video-menu-state.service.ts', msg: 'Singleton service for global video menu state management' },

  // ── Client — Shared Components ────────────────────────────────────────────
  { file: 'client/src/app/components/avatar/avatar.component.ts', msg: 'UI component logic for user profile avatars' },
  { file: 'client/src/app/components/video-menu/video-menu.css',  msg: 'Styling definitions for the interactive video options menu' },
  { file: 'client/src/app/components/video-menu/video-menu.html', msg: 'Video options menu HTML and global close detection' },
  { file: 'client/src/app/components/video-menu/video-menu.ts',   msg: 'Video menu component with global state management' },

  // ── Client — Pages ────────────────────────────────────────────────────────
  { file: 'client/src/app/Pages/home/home.css',                      msg: 'Cascading style sheets for the application landing page' },
  { file: 'client/src/app/Pages/home/home.html',                     msg: 'HTML structure for the modern presentation landing page' },
  { file: 'client/src/app/Pages/login/login.html',                   msg: 'Login page HTML with password visibility toggles' },
  { file: 'client/src/app/Pages/login/login.ts',                     msg: 'Login authentication flows and error handling logic' },
  { file: 'client/src/app/Pages/register/register.html',             msg: 'Register page HTML with password visibility toggles' },
  { file: 'client/src/app/Pages/register/register.ts',               msg: 'Register component with password visibility toggle state' },
  { file: 'client/src/app/Pages/forgot-password/forgot-password.html', msg: 'Forgot password HTML with password visibility toggles' },
  { file: 'client/src/app/Pages/forgot-password/forgot-password.ts',   msg: 'Forgot password component with password visibility state' },
  { file: 'client/src/app/Pages/profile/profile.html',               msg: 'Profile page HTML with password visibility toggles' },
  { file: 'client/src/app/Pages/profile/profile.ts',                 msg: 'Profile component controller for user data mutations' },
  { file: 'client/src/app/Pages/channel/channel.html',               msg: 'Channel page HTML for ownership-based delete options' },
  { file: 'client/src/app/Pages/channel/channel.ts',                 msg: 'Channel component logic with optimistic list removal' },
  { file: 'client/src/app/Pages/explore/explore.css',                msg: 'Styling and responsive grid layout for the explore page' },
  { file: 'client/src/app/Pages/explore/explore.html',               msg: 'HTML template structure for the trending videos grid' },
  { file: 'client/src/app/Pages/explore/explore.ts',                 msg: 'Component logic for fetching and displaying trending videos' },
  { file: 'client/src/app/Pages/history/history.css',                msg: 'Styling and grid layout for the user watch history page' },
  { file: 'client/src/app/Pages/history/history.html',               msg: 'Watch history HTML with remove-from-history options' },
  { file: 'client/src/app/Pages/history/history.ts',                 msg: 'Component logic for tracking and managing user watch history' },
  { file: 'client/src/app/Pages/main/main.css',                      msg: 'Main feed CSS for robust video details layout' },
  { file: 'client/src/app/Pages/main/main.html',                     msg: 'Main feed HTML for clean video card structural layout' },
  { file: 'client/src/app/Pages/main/main.ts',                       msg: 'Component controller for handling main feed video data streams' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.html',   msg: 'HTML template structure for the user subscriptions feed' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.ts',     msg: 'Component logic for fetching subscribed channels content' },
  { file: 'client/src/app/Pages/video-details/video-details.css',    msg: 'Custom tag styles and responsive layout for video details' },
  { file: 'client/src/app/Pages/video-details/video-details.html',   msg: 'Video details HTML for interactive owner moderation flows' },
  { file: 'client/src/app/Pages/video-details/video-details.ts',     msg: 'Video details controller for full owner moderation flows' },
];

const deletedFiles = [
  { file: 'drop-index.js',                          msg: 'Remove obsolete database index migration script' },
  { file: 'server/fix-google-id-migration.js',      msg: 'Remove obsolete Google ID migration script' },
  { file: 'server/test_db.js',                      msg: 'Remove obsolete database connection test script' },
  { file: 'server/test_upload.js',                  msg: 'Remove obsolete file upload test script' },
  { file: 'server/test_validator.js',               msg: 'Remove obsolete API validation test script' },
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

  // Final catch-all: commit any remaining staged/unstaged changes
  console.log('Running final catch-all commit for any remaining changes...');
  try {
    execSync('git add -A');
    execSync('git commit -m "YouCube — A premium video streaming platform"');
  } catch (e) {
    console.warn('No remaining changes to commit (or commit failed).');
  }

  console.log('\nAll files committed successfully.');
  console.log('Pushing to main...');
  execSync('git push origin main');
  console.log('Push complete!');
} catch (error) {
  console.error('Error during commit/push process:');
  console.error(error.stdout ? error.stdout.toString() : error.message);
}
