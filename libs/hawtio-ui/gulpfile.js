var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    fs = require('fs'),
    path = require('path'),
    s = require('underscore.string'),
    glob = require('glob'),
    path = require('path'),
    size = require('gulp-size'),
    uri = require('urijs'),
    s = require('underscore.string'),
    argv = require('yargs').argv,
    del = require('del'),
    runSequence = require('run-sequence');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  main: '.',
  ts: ['plugins/**/*.ts'],
  testTs: ['test-plugins/**/*.ts'],
  less: ['plugins/**/*.less'],
  testLess: ['test-plugins/**/*.less'],
  templates: ['plugins/**/*.html'],
  testTemplates: ['test-plugins/**/*.html'],
  templateModule: pkg.name + '-templates',
  testTemplateModule: pkg.name + '-test-templates',
  dist: argv.out || './dist/',
  js: pkg.name + '.js',
  testJs: pkg.name + '-test.js',
  css: pkg.name + '.css',
  testCss: pkg.name + '-test.css',
  tsProject: plugins.typescript.createProject({
    target: 'ES5',
    module: 'commonjs',
    declarationFiles: true,
    noExternalResolve: false
  }),
  testTsProject: plugins.typescript.createProject({
    target: 'ES5',
    module: 'commonjs',
    declarationFiles: false,
    noExternalResolve: false
  }),
  vendorJs: 'plugins/vendor/*.js'
};

gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('.'));
});

/** Adjust the reference path of any typescript-built plugin this project depends on */
gulp.task('path-adjust', function() {
  return gulp.src('libs/**/includes.d.ts')
    .pipe(plugins.replace(/"\.\.\/libs/gm, '"../../../libs'))
    .pipe(gulp.dest('libs'));
});

gulp.task('clean-defs', function() {
  return del('defs.d.ts');
});

gulp.task('example-tsc', ['tsc'], function() {
  var tsResult = gulp.src(config.testTs)
    .pipe(plugins.typescript(config.testTsProject))
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'Typescript compilation error - test'
    }));

    return tsResult.js
        .pipe(plugins.concat('test-compiled.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('example-template', ['example-tsc'], function() {
  return gulp.src(config.testTemplates)
    .pipe(plugins.angularTemplatecache({
      filename: 'test-templates.js',
      root: 'test-plugins/',
      standalone: true,
      module: config.testTemplateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.testTemplateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('example-concat', ['example-template'], function() {
  return gulp.src(['test-compiled.js', 'test-templates.js'])
    .pipe(plugins.concat(config.testJs))
    .pipe(gulp.dest(config.dist));
});

gulp.task('example-clean', ['example-concat'], function() {
  return del(['test-templates.js', 'test-compiled.js']);
});

gulp.task('tsc', ['clean-defs'], function() {
  var cwd = process.cwd();
  var tsResult = gulp.src(config.ts)
    .pipe(plugins.typescript(config.tsProject))
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'Typescript compilation error'
    }));

    return eventStream.merge(
      tsResult.js
        .pipe(plugins.concat('compiled.js'))
        .pipe(gulp.dest('.')),
      tsResult.dts
        .pipe(gulp.dest('d.ts')))
        .pipe(plugins.filter('**/*.d.ts'))
        .pipe(plugins.concatFilenames('defs.d.ts', {
          root: cwd,
          prepend: '/// <reference path="',
          append: '"/>'
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('less', function () {
  return gulp.src(config.less)
    .pipe(plugins.less({
      paths: [
        path.join(__dirname, 'less', 'includes'),
        path.join(__dirname, 'libs')
      ]
    }))
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'less file compilation error'
    }))
    .pipe(plugins.concat(config.css))
    .pipe(gulp.dest(config.dist));
});

gulp.task('test-less', function () {
  return gulp.src(config.testLess)
    .pipe(plugins.less({
      paths: [
        path.join(__dirname, 'less', 'includes'),
        path.join(__dirname, 'libs')
      ]
    }))
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'less file compilation error'
    }))
    .pipe(plugins.concat(config.testCss))
    .pipe(gulp.dest(config.dist));
});



gulp.task('template', ['tsc'], function() {
  return gulp.src(config.templates)
    .pipe(plugins.angularTemplatecache({
      filename: 'templates.js',
      root: 'plugins/',
      standalone: true,
      module: config.templateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.templateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('concat', ['template'], function() {
  return gulp.src(['compiled.js', 'templates.js', config.vendorJs])
    .pipe(plugins.concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return del(['templates.js', 'compiled.js']);
});

gulp.task('watch-less', function() {
  plugins.watch(config.less, function() {
    gulp.start('less');
  });
  plugins.watch(config.testLess, function() {
    gulp.start('test-less');
  });
});

gulp.task('watch', ['build', 'build-example', 'watch-less'], function() {
  plugins.watch(['libs/**/*.d.ts', config.ts, config.templates], function() {
    gulp.start(['tsc', 'template', 'concat', 'clean']);
  });
  plugins.watch([config.testTs, config.testTemplates], function() {
    gulp.start([ 'example-template', 'example-concat', 'example-clean']);
  });
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', config.dist + '/' + '*'], function() {
    gulp.start('reload');
  });
});

gulp.task('connect', ['watch'], function() {
  plugins.connect.server({
    root: '.',
    livereload: true,
    port: 2772,
    fallback: 'index.html',
    middleware: function(connect, options) {
      return [
        function(req, res, next) {
          var path = req.originalUrl;
          // avoid returning these files, they should get pulled from js
          if (s.startsWith(path, '/plugins/')) {
            console.log("returning 404 for: ", path);
            res.statusCode = 404;
            res.end();
            return;
          } else {
            //console.log("allowing: ", path);
            next();
          }
        }];
    }
  });
});

gulp.task('reload', function() {
  gulp.src('.')
    .pipe(plugins.connect.reload());
});

gulp.task('embed-images', ['concat'], function() {

  var replacements = [];

  var files = glob.sync('img/**/*.{png,svg,gif,jpg}');
  //console.log("files: ", files);
  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  function getDataURI(filename) {
    var relative = path.relative('.', filename);
    var ext = path.extname(filename);
    var mime = 'image/jpg';
    switch (ext) {
      case '.png':
        mime = 'image/png';
      break;
      case '.svg':
        mime = 'image/svg+xml';
      break;
      case '.gif':
        mime='image/gif';
      break;
    }
    var buf = fs.readFileSync(filename);
    return 'data:' + mime + ';base64,' + buf.toString('base64');
  }

  files.forEach(function(file) {
    replacements.push({
      match: new RegExp(escapeRegExp(file), 'g'),
      replacement: getDataURI(file)
    });
  });

  gulp.src(config.dist + config.js)
  .pipe(plugins.replaceTask({
    patterns: replacements
  }))
  .pipe(gulp.dest(config.dist));
});

gulp.task('site', ['build', 'build-example'], function() {
  gulp.src('website/.gitignore')
    .pipe(gulp.dest('site'));
  gulp.src('website/*')
    .pipe(gulp.dest('site'));
  gulp.src('index.html')
    .pipe(plugins.rename('404.html'))
    .pipe(gulp.dest('site'));
  gulp.src('README.md')
    .pipe(gulp.dest('site'));
  return gulp.src(['index.html', 'hawtio-nav-example.js', 'test/**', 'css/**', 'images/**', 'img/**', 'libs/**/*.js', 'libs/**/*.css', 'libs/**/*.swf', 'libs/**/*.woff','libs/**/*.woff2', 'libs/**/*.ttf', 'libs/**/*.map', 'dist/**'], {base: '.'})
    .pipe(gulp.dest('site'));

  var dirs = fs.readdirSync('./libs');
  dirs.forEach(function(dir) {
    var path = './libs/' + dir + "/img";
    try {
      if (fs.statSync(path).isDirectory()) {
        console.log("found image dir: " + path);
        var pattern = 'libs/' + dir + "/img/**";
        gulp.src([pattern]).pipe(gulp.dest('site/img'));
      }
    } catch (e) {
      // ignore, file does not exist
    }
  });
});

gulp.task('deploy', function() {
  return gulp.src(['site/**', 'site/**/*.*', 'site/*.*'], { base: 'site' })
    .pipe(plugins.debug({title: 'deploy'}))
    .pipe(plugins.ghPages({
      message: "[ci skip] Update site"
    }));
});

gulp.task('build-clean', function() {
  return del(['dist/hawtio-ui.*']);
});

gulp.task('build-example-clean', function() {
  return del(['dist/hawtio-ui-test.*']);
});

gulp.task('build', function(callback) {
  runSequence('build-clean',
              ['bower', 'path-adjust', 'tsc', 'less', 'template', 'concat', 'clean', 'embed-images'],
              callback);
});

gulp.task('build-example', function(callback) {
  runSequence('build-example-clean',
              ['example-tsc', 'test-less', 'example-template', 'example-concat', 'example-clean'],
              callback);
});

gulp.task('default', ['connect']);



