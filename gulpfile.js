const gulp = require('gulp');
const path = require('path');
const spawn = require('child_process').spawn;
const htmlmin = require('gulp-htmlmin');
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const clean = require('@hopin/wbt-clean');
const html = require('@hopin/wbt-html-assets');

const basetheme = require('@hopin/hugo-base-theme');
const gftheme = require('@gauntface/hugo-theme');

const desiredHugoVersion = 'v0.68.3';

/**
 * Themes
 */
gulp.task('gauntface-theme', async () => {
  const themeDir = path.join(__dirname, 'themes', 'gauntface')
  await fs.remove(themeDir);
  await gftheme.copyTheme(themeDir);
})

gulp.task('base-theme', async () => {
  const themeDir = path.join(__dirname, 'themes', 'hopin-base-theme')
  await fs.remove(themeDir);
  await basetheme.copyTheme(themeDir);
})

gulp.task('themes', gulp.parallel(
  'gauntface-theme',
  'base-theme',
))

/**
 * Build the whole site
 */
gulp.task('clean', gulp.series(
  clean.gulpClean([
    path.join(__dirname, 'public'),
    path.join(__dirname, 'themes'),
  ]),
))

gulp.task('hugo-build', () => {
  return new Promise((resolve, reject) => {
    const buildCmd = spawn('hugo', [], {
      stdio: 'inherit',
      cwd: __dirname,
    });
    buildCmd.on('error', (err) => {
      console.error('Failed to run hugo server: ', err);
      reject(new Error(`Failed to build site: ${err}`));
    });
    buildCmd.addListener('exit', (code) => {
      if (code == 0) {
        resolve();
        return
      }

      reject(new Error(`Hugo build exited with code '${code}'`));
    });
  });
})

gulp.task('minify-html', () => {
  return gulp.src(path.join(__dirname, 'public', '**', '*.html'))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
    }))
    .pipe(gulp.dest(path.join(__dirname, 'public')));
})

gulp.task('html-assets', gulp.series(
  html.gulpProcessFiles({
    htmlPath: path.join(__dirname, 'public'),
    jsonAssetsPath: path.join(__dirname, 'themes', 'gauntface', 'data', 'hopin'),
    genPath: path.join(__dirname, 'public', 'generated'),
    // debug: 'static-site-hosting-on-aws.html',
    output: true,
  }),
));

gulp.task('html', gulp.series(
  'html-assets',
  'minify-html',
))

gulp.task('hugo-version', async () => {
  const {stdout} = await exec('hugo version');
  const vr = /v\d*.\d*.\d*/
  const got = stdout.match(vr)
  if (!got) {
    throw new Error(`Failed to match hugo version from '${stdout}'`)
  }
  if (got[0] != desiredHugoVersion) {
    throw new Error(`Wrong hugo version; got ${got[0]}, want ${desiredHugoVersion}`)
  }
})

gulp.task('build', gulp.series(
  'hugo-version',
  'clean',
  'themes',
  'hugo-build',
  'html',
))

/**
 * The following are tasks are helpful for local dev and testing
 */
let serverInstance;

async function startServer() {
  serverInstance = spawn('hugo', ['server', '-D', '--ignoreCache'], {
    stdio: 'inherit',
    cwd: __dirname,
  });
  serverInstance.on('error', (err) => {
    console.error('Failed to run hugo server: ', err);
  });
  serverInstance.addListener('exit', (code) => {
    console.error('Hugo server has exited: ', code);
    setTimeout(startServer, 500);
  });
}

gulp.task('hugo-server', gulp.series(
  startServer,
));

gulp.task('restart-server', async () => {
  if (!serverInstance) {
    return;
  }

  serverInstance.kill();
});

gulp.task('watch-gf-theme', () => {
  const opts = {
    ignoreInitial: true,
  };
  return gulp.watch(
    [path.join(__dirname, 'node_modules', '@gauntface/hugo-theme', '**', '*')],
    opts,
    gulp.series('themes', 'restart-server'),
  );
});

gulp.task('watch-base-theme', () => {
  const opts = {
    ignoreInitial: true,
  };
  return gulp.watch(
    [path.join(__dirname, 'node_modules', '@hopin/hugo-base-theme', '**', '*')],
    opts,
    gulp.series('themes', 'restart-server'),
  );
});

gulp.task('watch',
  gulp.series(
    'themes',
    gulp.parallel(
      'watch-base-theme',
      'watch-gf-theme',
      'hugo-server',
    ),
  ),
);