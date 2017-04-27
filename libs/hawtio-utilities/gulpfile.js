var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    fs = require('fs'),
    path = require('path'),
    s = require('underscore.string'),
    argv = require('yargs').argv,
    del = require('del');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  main: '.',
  ts: ['helpers/*.ts'],
  dist: argv.out || './dist/',
  js: pkg.name + '.js',
  tsProject: plugins.typescript.createProject({
    target: 'ES5',
    outFile: 'compiled.js',
    declaration: true,
    noResolve: false
  })
};

gulp.task('clean-defs', function() {
  return del('defs.d.ts');
});

gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({devDependencies: true}))
    .pipe(gulp.dest('.'));
});

gulp.task('tsc', ['clean-defs'], function() {
  var cwd = process.cwd();
  var tsResult = gulp.src(config.ts)
    .pipe(config.tsProject())
    .on('error', plugins.notify.onError({
      message: '#{ error.message }',
      title: 'Typescript compilation error'
    }));

    return eventStream.merge(
      tsResult.js
        .pipe(plugins.concat(config.js))
        .pipe(gulp.dest(config.dist)),
      tsResult.dts
        .pipe(plugins.rename('defs.d.ts'))
        .pipe(gulp.dest('.')));
});

gulp.task('watch', ['build'], function() {
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', config.dist + '/' + config.js], function() {
    gulp.start('reload');
  });
  plugins.watch(['libs/**/*.d.ts', config.ts], function() {
    gulp.start('build');
  });
});

gulp.task('connect', ['watch'], function() {
  plugins.connect.server({
    root: '.',
    livereload: true,
    port: 2772,
    fallback: 'index.html'
  });
});

gulp.task('reload', function() {
  gulp.src('.')
    .pipe(plugins.connect.reload());
});

gulp.task('build', ['bower', 'tsc']);

gulp.task('default', ['connect']);
