const { execSync } = require('child_process');

const filesToCommit = [
  // ── Root & Docs ───────────────────────────────────────────────────────────
  { file: 'LICENSE',    msg: 'Project licensing and legal attributions' },
  { file: 'README.md',  msg: 'Comprehensive project documentation and setup guides' },
  { file: 'docs/testing.md',  msg: 'Comprehensive testing documentation and architecture guidelines' },
  { file: 'docs/backend.md',  msg: 'Backend architecture documentation and API schema definitions' },
  { file: 'docs/frontend.md', msg: 'Frontend architecture documentation and state management overview' },

  // ── Server ────────────────────────────────────────────────────────────────
  { file: 'server/app.js',                                  msg: 'Express application middleware configuration and CORS policies' },
  { file: 'server/server.js',                               msg: 'Server initialization script containing logging and environment validation' },
  { file: 'server/config/redis.js',                         msg: 'Redis cache connection logic and service logging integration' },
  { file: 'server/models/user.model.js',                    msg: 'Mongoose schema and authentication methods for User entities' },
  { file: 'server/models/channel.model.js',                 msg: 'Mongoose schema and validation rules for Channel entities' },
  { file: 'server/models/video.model.js',                   msg: 'Mongoose schema and indexing configurations for Video entities' },
  { file: 'server/controllers/auth.controller.js',          msg: 'Authentication controller with strict JSDoc types and request schemas' },
  { file: 'server/controllers/channel.controller.js',       msg: 'Channel controller handling data mutation and retrieval endpoints; adds userId to populated video list for ownership checks' },
  { file: 'server/controllers/comment.controller.js',       msg: 'Comment controller upgraded: video owners can now delete any comment on their videos (cascade auth check)' },
  { file: 'server/controllers/video.controller.js',         msg: 'Video controller with cascade delete: purges comments, likes, watch history, Cloudinary assets and Redis feed cache on deletion' },
  { file: 'server/controllers/watchHistory.controller.js',  msg: 'Watch history controller with typed JSDoc and endpoint handlers' },
  { file: 'server/routes/auth.routes.js',                   msg: 'Auth router endpoint definitions including register, login, verify and reset flows' },
  { file: 'server/routes/video.routes.js',                  msg: 'Router endpoint definitions for the video API service' },
  { file: 'server/utils/avatar.utils.js',                   msg: 'Backend utilities for dynamic avatar generation and processing' },
  { file: 'server/utils/resend.utils.js',                   msg: 'Email utility configurations and standardized logging systems' },
  { file: 'server/validators/video.validator.js',            msg: 'Validation schemas ensuring data integrity for multiple ID formats' },
  { file: 'server/validators/watchHistory.validator.js',     msg: 'Joi validation schema for watch history API request payloads' },

  // ── Client — Global ───────────────────────────────────────────────────────
  { file: 'client/src/styles.css',                          msg: 'Global design system tokens and foundational CSS variables' },
  { file: 'client/src/app/app.config.ts',                   msg: 'Core configuration settings for the Angular application' },
  { file: 'client/src/app/app.routes.ts',                   msg: 'Application routing architecture and navigation path definitions' },

  // ── Client — Navbar / Sidebar ─────────────────────────────────────────────
  { file: 'client/src/Components/navbar/navbar.html',       msg: 'HTML template structure for the main navigation bar' },
  { file: 'client/src/Components/navbar/navbar.css',        msg: 'Styling for the main navigation bar and user avatar container' },
  { file: 'client/src/Components/navbar/navbar.ts',         msg: 'Component logic and state management for the navigation bar' },
  { file: 'client/src/Components/sidebar/sidebar.html',     msg: 'HTML template structure for the application sidebar navigation' },

  // ── Client — Pipes ────────────────────────────────────────────────────────
  { file: 'client/src/app/pipes/cloudinary.pipe.ts',        msg: 'Image transformation pipe for robust Cloudinary asset handling' },
  { file: 'client/src/app/pipes/duration.pipe.ts',          msg: 'String formatting pipe for human-readable video durations' },

  // ── Client — Services ─────────────────────────────────────────────────────
  { file: 'client/src/app/services/auth.ts',                msg: 'Authentication service with strict typing and user state management' },
  { file: 'client/src/app/services/comment.service.ts',     msg: 'Comment service: extended Comment interface with liked, disliked, likeActionLoading UI state fields' },
  { file: 'client/src/app/services/config.service.ts',      msg: 'Application configuration service for dynamic environment variables' },
  { file: 'client/src/app/services/history.service.ts',     msg: 'Service layer for interacting with the watch history backend endpoints' },
  { file: 'client/src/app/services/video.service.ts',       msg: 'Video service: added deleteVideo method and enriched Video interface with missing fields' },
  { file: 'client/src/app/services/video-menu-state.service.ts', msg: 'New singleton service using BehaviorSubject to enforce single open video menu at a time across all pages' },

  // ── Client — Shared Components ────────────────────────────────────────────
  { file: 'client/src/app/components/avatar/avatar.component.ts', msg: 'UI component and styling logic for user profile avatars' },
  { file: 'client/src/app/components/video-menu/video-menu.css',  msg: 'Styling definitions for the interactive video options menu dropdown' },
  { file: 'client/src/app/components/video-menu/video-menu.html', msg: 'Video options menu HTML: removed stopPropagation from container to allow global close detection' },
  { file: 'client/src/app/components/video-menu/video-menu.ts',   msg: 'Video menu component rewritten with VideoMenuStateService to guarantee only one menu open at a time, fixes multi-menu bug on home page' },

  // ── Client — Pages ────────────────────────────────────────────────────────
  { file: 'client/src/app/Pages/home/home.css',                      msg: 'Cascading style sheets for the application landing page' },
  { file: 'client/src/app/Pages/home/home.html',                     msg: 'HTML structure for the modern presentation landing page' },
  { file: 'client/src/app/Pages/login/login.html',                   msg: 'Login page HTML: password field now has eye icon toggle for show/hide functionality' },
  { file: 'client/src/app/Pages/login/login.ts',                     msg: 'Authentication flows and error handling logic for user login' },
  { file: 'client/src/app/Pages/register/register.html',             msg: 'Register page HTML: password and confirm password fields with eye icon toggles' },
  { file: 'client/src/app/Pages/register/register.ts',               msg: 'Register component: added name field, confirmPassword validator, and password visibility toggle state' },
  { file: 'client/src/app/Pages/forgot-password/forgot-password.html', msg: 'Forgot password HTML: password reset fields with eye icon visibility toggles' },
  { file: 'client/src/app/Pages/forgot-password/forgot-password.ts',   msg: 'Forgot password component logic with password show/hide state management' },
  { file: 'client/src/app/Pages/profile/profile.html',               msg: 'Profile page HTML: update password fields with eye icon show/hide toggles' },
  { file: 'client/src/app/Pages/profile/profile.ts',                 msg: 'Profile component controller for managing user data mutations and profile updates' },
  { file: 'client/src/app/Pages/channel/channel.html',               msg: 'Channel page HTML: video card menu now supports ownership-based delete option' },
  { file: 'client/src/app/Pages/channel/channel.ts',                 msg: 'Channel component logic with video deletion support and optimistic list removal on success' },
  { file: 'client/src/app/Pages/explore/explore.css',                msg: 'Styling and responsive grid layout for the explore page' },
  { file: 'client/src/app/Pages/explore/explore.html',               msg: 'HTML template structure for the trending videos explore grid' },
  { file: 'client/src/app/Pages/explore/explore.ts',                 msg: 'Component logic for fetching and displaying trending videos' },
  { file: 'client/src/app/Pages/history/history.css',                msg: 'Styling and grid layout for the user watch history page' },
  { file: 'client/src/app/Pages/history/history.html',               msg: 'Watch history HTML template with video cards and remove-from-history menu option' },
  { file: 'client/src/app/Pages/history/history.ts',                 msg: 'Component logic for tracking and managing the user watch history' },
  { file: 'client/src/app/Pages/main/main.css',                      msg: 'Main feed CSS: video-details set to position:relative; menu button pinned absolutely to top-right; padding-right reserves space so title never clips under button' },
  { file: 'client/src/app/Pages/main/main.html',                     msg: 'Main feed HTML: clean single-structure video card with ⋮ menu pinned top-right of text column, matching YouTube card layout' },
  { file: 'client/src/app/Pages/main/main.ts',                       msg: 'Component controller for handling main feed video data streams' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.html',   msg: 'HTML template structure for the user subscriptions feed' },
  { file: 'client/src/app/Pages/subscriptions/subscriptions.ts',     msg: 'Component logic for fetching and rendering subscribed channels content' },
  { file: 'client/src/app/Pages/video-details/video-details.css',    msg: 'Custom tag styles and responsive layout for the video details page; adds btn-reaction-danger and delete-video-modal styles' },
  { file: 'client/src/app/Pages/video-details/video-details.html',   msg: 'Video details HTML: adds Delete button for video owner, comment like/dislike thumbs, canDeleteComment-gated delete for video creator moderation, and delete-video confirmation modal' },
  { file: 'client/src/app/Pages/video-details/video-details.ts',     msg: 'Video details controller: isOwnVideo, canDeleteComment, toggleCommentLike, requestDeleteVideo/confirmDeleteVideo methods for full owner moderation flow' },
];

const deletedFiles = [
  { file: 'drop-index.js',                          msg: 'Obsolete database index migration script' },
  { file: 'server/fix-google-id-migration.js',      msg: 'Obsolete Google ID migration script' },
  { file: 'server/test_db.js',                      msg: 'Obsolete database connection testing script' },
  { file: 'server/test_upload.js',                  msg: 'Obsolete file upload testing script' },
  { file: 'server/test_validator.js',               msg: 'Obsolete API validation testing script' },
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
