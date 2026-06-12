import gulp from 'gulp';
import pug from 'gulp-pug';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browserSyncPackage from 'browser-sync';
import { deleteAsync } from 'del';

const { src, dest, watch, series, parallel } = gulp;
const sass = gulpSass(dartSass);
const browserSync = browserSyncPackage.create();

function clean() {
  return deleteAsync(['dist']);
}

function compilePug() {
  return src([
    'src/pug/**/*.pug',
    '!src/pug/**/_*/**',
    '!src/pug/**/_*.pug'
  ])
    .pipe(pug())
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
}

function compileResources() {
  return src(
    [
      'src/resources/**/*',
      '!src/resources/**/_*/**',
      '!src/resources/**/_*'
    ],
    { encoding: false }
  )
    .pipe(dest('dist/resources'));
}

function compileCSS() {
  return src([
    'src/scss/**/*.scss',
    '!src/scss/**/_*/**',
    '!src/scss/**/_*.scss'
  ])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(dest('dist/css'))
    .pipe(browserSync.stream());
}

function compileJS() {
  return src([
    'src/js/**/*.js',
    '!src/js/**/_*/**',
    '!src/js/**/_*.js'
  ])
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream());
}

function serve() {
  browserSync.init({
    server: { baseDir: 'dist' }
  });

  watch('src/pug/**/*.pug', compilePug);
  watch('src/resources/**/*', compileResources);
  watch('src/scss/**/*.scss', compileCSS);
  watch('src/js/**/*.js', compileJS);
}

export default series(
  clean,
  parallel(compilePug, compileCSS, compileResources, compileJS),
  serve
);
