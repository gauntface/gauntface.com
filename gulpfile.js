const gulp = require('gulp');
const path = require('path');
const spawn = require('child_process').spawn;
const htmlmin = require('gulp-htmlmin');
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const browserSync = require('browser-sync').create();
const ham = require('@gauntface/html-asset-manager');

const clean = require('@hopin/wbt-clean');

const basetheme = require('@hopin/hugo-base-theme');
const gftheme = require('@gauntface/hugo-theme');

const desiredHugoVersion = 'v0.79.0';

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
      minifyCSS: true,
      minifyJS: true,
      minifyURLs: true,
    }))
    .pipe(gulp.dest(path.join(__dirname, 'public')));
})

gulp.task('html-assets', () => {
  return ham.manageAssets({
    config: path.join(__dirname, 'asset-manager.json'),
    vimeo: process.env['VIMEO_TOKEN'],
    debug: 'static-site-hosting-on-aws',
    output: true,
  });
});

gulp.task('genimgs', () => {
  return ham.generateImages({
    config: path.join(__dirname, 'asset-manager.json'),
    output: true,
  });
})

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

gulp.task('verification',() => {
  return gulp.src(path.join(__dirname, 'verification', '**', '*'))
    .pipe(gulp.dest(path.join(__dirname, 'public')));
})

gulp.task('build-raw', gulp.series(
  'hugo-version',
  'clean',
  'themes',
  'hugo-build',
));

gulp.task('build', gulp.series(
  'build-raw',
  'genimgs',
  'html',
  'verification',
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

gulp.task('watch-gf-theme-prod', () => {
  const opts = {
    ignoreInitial: true,
  };
  return gulp.watch(
    [path.join(__dirname, 'node_modules', '@gauntface/hugo-theme', '**', '*')],
    opts,
    gulp.series('themes', 'build'),
  );
});

gulp.task('watch-any', () => {
  const opts = {
    delay: 500,
    ignoreInitial: true,
  };
  return gulp.watch(
    [
      path.posix.join(__dirname, 'archetypes', '**', '*'),
      path.posix.join(__dirname, 'content', '**', '*'),
      path.posix.join(__dirname, 'static', '**', '*'),
      path.posix.join(__dirname, 'vertification', '**', '*'),
    ],
    opts,
    gulp.series('build', async () => browserSync.reload()),
  );
});

gulp.task('browser-sync', function() {
  browserSync.init({
      server: {
          baseDir: "./public/",
      }
  });
});

gulp.task('watch-prod',
  gulp.series(
    'build',
    gulp.parallel(
      'browser-sync',
      'watch-gf-theme-prod',
      'watch-any',
    ),
  ),
);