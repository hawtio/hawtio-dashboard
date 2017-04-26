var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    fs = require('fs'),
    path = require('path'),
    size = require('gulp-size'),
    uri = require('urijs'),
    s = require('underscore.string'),
    hawtio = require('hawtio-node-backend'),
    del = require('del'),
    tslint = require('gulp-tslint'),
    tslintRules = require('./tslint.json');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  main: '.',
  ts: ['plugins/**/*.ts'],
  testTs: ['test-plugins/**/*.ts'],
  less: ['plugins/**/*.less'],
  templates: ['plugins/**/*.html'],
  testTemplates: ['test-plugins/**/*.html'],
  templateModule: pkg.name + '-templates',
  testTemplateModule: pkg.name + '-test-templates',
  dist: './dist/',
  js: pkg.name + '.js',
  testJs: pkg.name + '-test.js',
  css: pkg.name + '.css',
  tsProject: plugins.typescript.createProject({
    target: 'ES5',
    outFile: 'compiled.js',
    declaration: true,
    noResolve: false,
    removeComments: true
  }),
  testTsProject: plugins.typescript.createProject({
    target: 'ES5',
    outFile: 'test-compiled.js',
    declaration: false,
    noResolve: false
  }),
  tsLintOptions: {
    rulesDirectory: './tslint-rules/',
    emitError: false
  }
};

var normalSizeOptions = {
    showFiles: true
}, gZippedSizeOptions  = {
    showFiles: true,
    gzip: true
};


gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('.'));
});

/** Adjust the reference path of any typescript-built plugin this project depends on */
gulp.task('path-adjust', function() {
  return eventStream.merge(
    gulp.src('libs/**/includes.d.ts')
      .pipe(plugins.replace(/"\.\.\/libs/gm, '"../../../libs'))
      .pipe(gulp.dest('libs')),
    gulp.src('libs/**/defs.d.ts')
      .pipe(plugins.replace(/"libs/gm, '"../../libs'))
      .pipe(gulp.dest('libs'))
  )
});

gulp.task('clean-defs', function() {
  return del('defs.d.ts');
});

gulp.task('example-tsc', ['tsc'], function() {
  var tsResult = gulp.src(config.testTs)
    .pipe(config.testTsProject())
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'Typescript compilation error - test'
    }));

    return tsResult.js.pipe(gulp.dest('.'));
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
    .pipe(plugins.sourcemaps.init())
    .pipe(config.tsProject())
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'Typescript compilation error'
    }));

    return eventStream.merge(
      tsResult.js
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest('.')),
      tsResult.dts
        .pipe(plugins.rename('defs.d.ts'))
        .pipe(gulp.dest('.')));
});

gulp.task('less', function () {
  return gulp.src(config.less)
    .pipe(plugins.less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .on('error', plugins.notify.onError({
      onLast: true,
      message: '<%= error.message %>',
      title: 'less file compilation error'
    }))
    .pipe(plugins.concat(config.css))
    .pipe(gulp.dest('./dist'));
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
  var gZipSize = size(gZippedSizeOptions);
  var license = tslintRules.rules['license-header'][1];
  return gulp.src(['compiled.js', 'templates.js'])
    .pipe(plugins.concat(config.js))
    .pipe(plugins.header(license))
    .pipe(size(normalSizeOptions))
    .pipe(gZipSize)
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return del(['templates.js', 'compiled.js']);
});

gulp.task('watch-less', function() {
  plugins.watch(config.less, function() {
    gulp.start('less');
  });
});

gulp.task('watch', ['build', 'build-example', 'watch-less'], function() {
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', config.dist + '/' + '*'], function() {
    gulp.start('reload');
  });
  plugins.watch(['libs/**/*.d.ts', config.ts, config.templates], function() {
    gulp.start(['tsc', 'template', 'concat', 'clean']);
  });
  plugins.watch([config.testTs, config.testTemplates], function() {
    gulp.start([ 'example-template', 'example-concat', 'example-clean']);
  });
});


gulp.task('connect', ['watch'], function() {
  /*
   * Example of fetching a URL from the environment, in this case for kubernetes
  var kube = uri(process.env.KUBERNETES_MASTER || 'http://localhost:8080');
  console.log("Connecting to Kubernetes on: " + kube);
  */

  hawtio.setConfig({
    port: 2772,
    staticProxies: [
    /*
    // proxy to a service, in this case kubernetes
    {
      proto: kube.protocol(),
      port: kube.port(),
      hostname: kube.hostname(),
      path: '/services/kubernetes',
      targetPath: kube.path()
    },
    // proxy to a jolokia instance
    {
      proto: kube.protocol(),
      hostname: kube.hostname(),
      port: kube.port(),
      path: '/jolokia',
      targetPath: '/hawtio/jolokia'
    }
    */
    ],
    staticAssets: [{
      path: '/',
      dir: '.'

    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });
  /*
   * Example middleware that returns a 404 for templates
   * as they're already embedded in the js
  hawtio.use('/', function(req, res, next) {
          var path = req.originalUrl;
          // avoid returning these files, they should get pulled from js
          if (s.startsWith(path, '/plugins/') && s.endsWith(path, 'html')) {
            console.log("returning 404 for: ", path);
            res.statusCode = 404;
            res.end();
          } else {
            console.log("allowing: ", path);
            next();
          }
        });
        */
  hawtio.listen(function(server) {
    var host = server.address().address;
    var port = server.address().port;
    console.log("started from gulp file at ", host, ":", port);
  });
});

gulp.task('reload', function() {
  gulp.src('.')
    .pipe(hawtio.reload());
});

gulp.task('site', ['build', 'build-example'], function() {
  gulp.src('website/.gitignore')
    .pipe(gulp.dest('site'));
  gulp.src('website/*')
    .pipe(gulp.dest('site'));
  gulp.src('index.html')
    .pipe(plugins.rename('404.html'))
    .pipe(gulp.dest('site'));
  gulp.src(['README.md', 'index.html', 'css/**', 'images/**', 'img/**', 'libs/**/*.js', 'libs/**/*.css', 'libs/**/*.swf', 'libs/**/*.woff','libs/**/*.woff2', 'libs/**/*.ttf', 'libs/**/*.map', 'dist/**'], {base: '.'})
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

gulp.task('deploy', ['build', 'build-example', 'site'], function() {
  return gulp.src(['site/**', 'site/**/*.*', 'site/*.*'], { base: 'site' })
    .pipe(plugins.debug({title: 'deploy'}))
    .pipe(plugins.ghPages({
      message: "[ci skip] Update site"
    }));
});


gulp.task('build', ['bower', 'path-adjust', 'tsc', 'less', 'template', 'concat', 'clean']);

gulp.task('build-example', ['example-tsc', 'example-template', 'example-concat', 'example-clean']);

gulp.task('default', ['connect']);



