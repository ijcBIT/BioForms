// Include gulp & gulp plugins
var gulp = require('gulp'),    
    sourcemaps = require('gulp-sourcemaps'),
    jshint = require('gulp-jshint'),
    less = require('gulp-less'),
    stylish = require('jshint-stylish'),
    autoprefixer = require('gulp-autoprefixer'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    connect = require('gulp-connect'),
    htmlreplace = require('gulp-html-replace'),
    ngAnnotate = require('gulp-ng-annotate'),
    historyApiFallback = require('connect-history-api-fallback'),
    Server = require('karma').Server,
    protractor = require('gulp-protractor').protractor,
    replace = require('gulp-replace'),
    wait = require('gulp-wait'),
    colors = require('colors'),
    { createProxyMiddleware } = require('http-proxy-middleware'),
    run = require('gulp-run'),
    clean = require('gulp-clean'), 
    rev = require('gulp-rev'), // Add versioning (hashing) plugin    
    revReplace = require('gulp-rev-replace'); 


const paths = {
  src: './app/',                // The source folder for your AngularJS app
  dist: './dist/',              // The output folder for the build
  assets: [
    './app/img/**/*.*', 
    './app/media/**/*.*', 
    './app/fonts/**/*.*',
    './app/**/*.css', 
    '!./app/bower_components/**/*.*',
    '!./app/config/**/*.*',
    '!./app/index.html',
    './app/config/version.js'],      
  html: './dist/**/*.html',      // Path to AngularJS templates and index.html
  scripts: './dist/**/*.js',     // Path to AngularJS scripts
  css: './dist/css/*.css',       // Path to css files
};

//Clean the dist folder
gulp.task('cleanDist', () => {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean());
});

//Add hash revision to assets (CSS, JS, images)
gulp.task('revision', () => {
  return gulp.src(paths.assets,{ base: paths.src })
    .pipe(rev())                         // Add hash to filenames
    .pipe(gulp.dest(paths.dist))         // Save hashed assets in dist folder
    .pipe(rev.manifest())                // Create manifest file
    .pipe(gulp.dest(paths.dist));        // Save manifest in dist folder
});

// Replace references in HTML/JS files with hashed filenames
gulp.task('revReplace', () => {
  const manifest = gulp.src(paths.dist + 'rev-manifest.json');

  return gulp.src([paths.html, paths.scripts, paths.css], { base: paths.dist })
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest(paths.dist)); // Save updated files in dist folder
});

// Replace references in HTML/JS files with hashed filenames
gulp.task('revReplaceRaw', () => {
  const manifest = gulp.src(paths.dist + 'rev-manifest.json');

  return gulp.src(['./app/**/*.html', './app/**/*.js', './app/**/*.json','./app/favicon.ico','./app/bower_components/**/*.*'], { base: paths.src })
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest(paths.dist)); // Save updated files in dist folder
});

//Add a build task that includes the production steps
gulp.task('build-production', gulp.series(
   'cleanDist',
   'revision',
   'revReplace',
   'revReplaceRaw'
));

/**
 * Create error handling exception using gulp-util.
 */
var onError = function (err) {
  gutil.beep();
  console.log(err.red);
  this.emit('end'); //added so that gulp will end the task on error, and won't hang.
};
// New task to start Node server
gulp.task('start-node-server-dev', function(done) {
  console.log("Starting Node server with nodemon for development...");
  var cmd = 'npx nodemon --inspect=0.0.0.0:9229 api/src/index.js';

  // Execute the Node.js command
  run(cmd).exec()    // run "npm start". 
    .pipe(gulp.dest('output'));
  
  done();
});

// Lint task
gulp.task('lint', function (done) {
  return gulp.src('app/scripts/*.js')
      .pipe(sourcemaps.init()) // Initialize source map generation
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(sourcemaps.write('.', {
        sourceRoot: '/scripts'  // Adjust this to match the server's root
      }))
      .pipe(connect.reload());
});

// Compile LESS files
gulp.task('less', function (done) {
  return gulp.src(['app/less/style-creator.less'])
      .pipe(plumber({
        errorHandler: onError
      }))
      .pipe(sourcemaps.init()) // Initialize sourcemap generation
      .pipe(less().on('error', gutil.log))
      .pipe(autoprefixer({
        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'IE 9'],
        cascade : true
      }))
      .pipe(sourcemaps.write('.')) // Write sourcemaps to the same directory as the output file      
      .pipe(gulp.dest('app/css'))
      .pipe(connect.reload());
});

gulp.task('copy:resources', function () {
  var glyphiconsGlob = 'app/bower_components/bootstrap/fonts/*.*';
  return gulp.src(glyphiconsGlob).pipe(gulp.dest('app/fonts/'));
});


gulp.task('server-development', function (done) {
  console.log("Starting development server...");

  connect.server({
    root: 'app', // Path to serve static files from
    port: 80, // Development server port
    livereload: true, // Enable live reload
    fallback: 'app/index.html', // SPA fallback for AngularJS routes
    host: '0.0.0.0', // Listen on all interfaces
    middleware: function (connect, opt) {
      return [
        function (req, res, next) {
          const host = req.headers.host; // Gets the current host (e.g., localhost:4200, or a cloud-hosted URL)
          const protocol = req.headers['x-forwarded-proto'] || 'http'; // Detects HTTPS if behind a proxy
            
          if (req.url === '/genomica') {
            const newLocation = '/instances/create/https://repo.metadatacenter.org/templates/3ae58251-34c2-4a0d-840d-cb17ea441ea0?folderId=https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F2b1d7669-c3eb-4571-b22c-ec1c2cf0aeef';
            const redirectUrl = `${protocol}://${host}` + newLocation;
            res.writeHead(302, { Location: redirectUrl});
            res.end();
          } if (req.url === '/test') {
            const newLocation = '/instances/create/https://repo.metadatacenter.org/templates/efd7602c-4a02-45b6-a665-b5fb3360f066?folderId=https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F02d81b00-f4b4-4467-8721-72a90c7998c2';
            const redirectUrl = `${protocol}://${host}` + newLocation;
            res.writeHead(302, { Location: redirectUrl});
            res.end();
          } else {
            next();
          }
        },
        // Proxy for /templates requests
        createProxyMiddleware({
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathFilter: '/templates',
        }),

        // Proxy for /api requests
        createProxyMiddleware({
          target: 'http://localhost:3000',
          changeOrigin: true, // Modify the `Host` header to match the target
          pathFilter: '/api',
        }),


        // Proxy for /users requests
        createProxyMiddleware({
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathFilter: '/users',
        }),

        // Fallback middleware for AngularJS routes
        function (req, res, next) {
          if (req.url.indexOf('.') === -1) {
            req.url = '/index.html'; // Serve index.html for non-file requests
          }
          next();
        }, 
      ];
    },
  }); 

  done();
});

gulp.task('html', function (done) {
  return gulp.src('/app/views/*.html')
      .pipe(connect.reload());
});

// Task to replace service URLs
gulp.task('replace-url', function (done) {
  gulp.src(['app/config/src/url-service.conf.json'])
      .pipe(replace('templateServerUrl', 'https://template.' + cedarRestHost))
      .pipe(replace('resourceServerUrl', 'https://resource.' + cedarRestHost))
      .pipe(replace('userServerUrl', 'https://user.' + cedarRestHost))
      .pipe(replace('terminologyServerUrl', 'https://terminology.' + cedarRestHost))
      .pipe(replace('valueRecommenderServerUrl', 'https://valuerecommender.' + cedarRestHost))
      .pipe(replace('groupServerUrl', 'https://group.' + cedarRestHost))
      .pipe(replace('schemaServerUrl', 'https://schema.' + cedarRestHost))
      .pipe(replace('submissionServerUrl', 'https://submission.' + cedarRestHost))
      .pipe(replace('messagingServerUrl', 'https://messaging.' + cedarRestHost))
      .pipe(replace('openViewBaseUrl', 'https://openview.' + cedarRestHost))
      .pipe(replace('impexServerUrl', 'https://impex.' + cedarRestHost))
      .pipe(replace('artifactsFrontendUrl', 'https://artifacts.' + cedarRestHost))
      .pipe(replace('dataciteDOIBaseUrl', 'https://bridging.' + cedarRestHost + '/doi/datacite'))
      .pipe(replace('downloadBaseUrl', 'https://bridging.' + cedarRestHost + '/resources/download'))
      .pipe(gulp.dest('app/config/'));
  done();
});

// Task to set up tracking
gulp.task('replace-tracking', function (done) {
  gulp.src(['app/config/src/tracking-service.conf.json'])
      .pipe(replace('googleAnalyticsKey', cedarAnalyticsKey))
      .pipe(gulp.dest('app/config/'));
  done();
});

// Task to set up version numbers in included js file
gulp.task('replace-version', function (done) {
  const timestamp = Date.now(); // Generate a unique timestamp
  return gulp.src(['app/config/src/version.js'])
      .pipe(replace('cedarVersionValue', cedarVersion))
      .pipe(replace('cedarVersionModifierValue', `${timestamp}`))
      .pipe(replace('dataciteEnabledValue', dataciteEnabled))
      //.pipe(replace('cedarGA4TrackingIdValue', cedarGA4TrackingId))
      .pipe(gulp.dest('app/config/'));
});

// Watch files for changes
gulp.task('watch', function (done) {
  gulp.watch('app/scripts/*.js', gulp.series('lint'));
  gulp.watch('app/less/*.less', gulp.series('less'));
  gulp.watch('app/views/*.html', gulp.series('html'));
  done();
});

// Sets up the environment required to run the Karma tests in Travis
gulp.task('karma-travis-env', gulp.series(['replace-url', 'replace-tracking', 'replace-version', 'lint', 'less', 'copy:resources'], function (done) {
  done();
}));

gulp.task('karma-tests', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, function (exitCode) {
    done();
    process.exit(exitCode);
  }).start();
});

gulp.task('test-env', function (done) {
  gulp.src(['tests/config/src/test-env.js'], {allowEmpty:true})
      .pipe(replace('protractorBaseUrl', 'https://cedar.' + cedarUIHost))
      .pipe(replace('protractorTestUser1Login', cedarTestUser1Login))
      .pipe(replace('protractorTestUser1Password', cedarTestUser1Password))
      .pipe(replace('protractorTestUser1Name', cedarTestUser1Name))
      .pipe(replace('protractorTestUser2Login', cedarTestUser2Login))
      .pipe(replace('protractorTestUser2Password', cedarTestUser2Password))
      .pipe(replace('protractorTestUser2Name', cedarTestUser2Name))
      .pipe(replace('protractorCedarVersion', cedarVersion))
      .pipe(gulp.dest('tests/config/'));
  done();
});

// Protractor tests
gulp.task('test-clean-up', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/clean-up-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-work-space', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/workspace-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-staging', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/staging-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-sidebar', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/sidebar-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-all', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/clean-up-spec.js',
    './tests/e2e/sidebar-spec.js',
    './tests/e2e/metadata-creator-spec.js',
    './tests/e2e/template-creator-spec.js',
    './tests/e2e/copy-move-spec.js',
    './tests/e2e/share-delete-spec.js',

  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-folder-permissions', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/clean-up-spec.js',
    './tests/e2e/folder-permissions-spec.js',
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-resource-permissions', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/clean-up-spec.js',
    './tests/e2e/resource-permissions-spec.js',
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-delete', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/create-folders-spec.js',
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-copy-move', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/copy-move-spec.js',
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-share-delete', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/share-delete-spec.js',
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-permissions', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/delete-resource-spec.js',
    './tests/e2e/folder-permissions-spec.js',
    './tests/e2e/resource-permissions-spec.js',
    './tests/e2e/update-permissions-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-update-permissions', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/update-permissions-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));



gulp.task('test--update-permissions', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/update-permissions-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-metadata', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/metadata-creator-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));

gulp.task('test-template', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/template-creator-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));


gulp.task('test-form', gulp.series('test-env', function () {
  return gulp.src([
    './tests/e2e/metadata-creator-spec.js',
    './tests/e2e/template-creator-spec.js'
  ])
      .pipe(protractor({
        configFile: "protractor-sequential.config.js"
      }))
      .on('error', function (e) {
        throw e
      });
}));



function exitWithError(msg) {
  onError(msg);
  console.log(
      "Please see: https://github.com/metadatacenter/cedar-docs/wiki/Configure-environment-variables-on-OS-X".yellow);
  console.log("Please restart the application after setting the variables!".green);
  console.log();
  console.log();
  process.exit();
}

function readAllEnvVarsOrFail() {
  console.log("- Environment variables used:".yellow);
  for (var key  in envConfig) {
    console.log(key);
    if (!process.env.hasOwnProperty(key)) {
      exitWithError('You need to set the following environment variable: ' + key);
    } else {
      var value = process.env[key];
      envConfig[key] = value;
      if (key.indexOf('PASSWORD') <= -1) {
        console.log(("- Environment variable " + key + " found: ").green + value.bold);
      } else {
        console.log(("- Environment variable " + key + " found: ").green + "*******".bold);
      }
    }
  }
}

function getFrontendEnvVar(varNameSuffix) {
  return 'CEDAR_FRONTEND_' + cedarFrontendTarget + '_' + varNameSuffix;
}

// Get environment variables
let envConfig = {
  'CEDAR_ANALYTICS_KEY'       : null,
//  'CEDAR_GA4_TRACKING_ID'     : null,
  'CEDAR_FRONTEND_BEHAVIOR'   : null,
  'CEDAR_FRONTEND_TARGET'     : null,
  'CEDAR_VERSION'             : null,
//  'CEDAR_VERSION_MODIFIER'    : null,
  'CEDAR_DATACITE_ENABLED'    : null
};
console.log();
console.log();
console.log(
    "-------------------------------------------- ************* --------------------------------------------".red);
console.log("- Starting CEDAR front end server...".green);
readAllEnvVarsOrFail();
const cedarAnalyticsKey = envConfig['CEDAR_ANALYTICS_KEY'];
//const cedarGA4TrackingId = envConfig['CEDAR_GA4_TRACKING_ID'];
const cedarFrontendBehavior = envConfig['CEDAR_FRONTEND_BEHAVIOR'];
const cedarFrontendTarget = envConfig['CEDAR_FRONTEND_TARGET'];
const cedarVersion = envConfig['CEDAR_VERSION'];
//const cedarVersionModifier = envConfig['CEDAR_VERSION_MODIFIER'];
const dataciteEnabled = envConfig['CEDAR_DATACITE_ENABLED'];

var cedarUIHostVarName = getFrontendEnvVar('UI_HOST');
envConfig[cedarUIHostVarName] = null;
var cedarRestHostVarName = getFrontendEnvVar('REST_HOST');
envConfig[cedarRestHostVarName] = null;

var cedarUser1LoginVarName = getFrontendEnvVar('USER1_LOGIN');
envConfig[cedarUser1LoginVarName] = null;
var cedarUser1PasswordVarName = getFrontendEnvVar('USER1_PASSWORD');
envConfig[cedarUser1PasswordVarName] = null;
var cedarUser1NameVarName = getFrontendEnvVar('USER1_NAME');
envConfig[cedarUser1NameVarName] = null;

var cedarUser2LoginVarName = getFrontendEnvVar('USER2_LOGIN');
envConfig[cedarUser2LoginVarName] = null;
var cedarUser2PasswordVarName = getFrontendEnvVar('USER2_PASSWORD');
envConfig[cedarUser2PasswordVarName] = null;
var cedarUser2NameVarName = getFrontendEnvVar('USER2_NAME');
envConfig[cedarUser2NameVarName] = null;

readAllEnvVarsOrFail();

var cedarUIHost = envConfig[cedarUIHostVarName];
var cedarRestHost = envConfig[cedarRestHostVarName];

var cedarTestUser1Login = envConfig[cedarUser1LoginVarName];
var cedarTestUser1Password = envConfig[cedarUser1PasswordVarName];
var cedarTestUser1Name = envConfig[cedarUser1NameVarName];

var cedarTestUser2Login = envConfig[cedarUser2LoginVarName];
var cedarTestUser2Name = envConfig[cedarUser2NameVarName];
var cedarTestUser2Password = envConfig[cedarUser2PasswordVarName];

console.log(
    "-------------------------------------------- ************* --------------------------------------------".red);
console.log();

// Prepare task list
var taskNameList = [];
taskNameList.push('lint', 'less' /*, 'copy:resources' */, 'replace-url', 'replace-tracking', 'replace-version'/*, 'test-env' */);

if (cedarFrontendBehavior === 'develop') {
  taskNameList.push(gulp.parallel('start-node-server-dev','server-development'));
  taskNameList.push('watch');
} else if (cedarFrontendBehavior === 'server') {
  taskNameList.push('build-production');
  console.log("Editor is configuring URLs, and exiting. The frontend content will be served by nginx");
} else {
  exitWithError("Invalid CEDAR_FRONTEND_BEHAVIOR value. Please set to 'develop' or 'server'!");
}

// Launch tasks
gulp.task('default', gulp.series(taskNameList, function (done) {
  done();
}));
