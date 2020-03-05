const gulp = require('gulp');
const path = require('path');
const spawn = require('child_process').spawn;

const fs = require('fs-extra');

const basetheme = require('@hopin/hugo-base-theme');
const gftheme = require('@gauntface/hugo-theme');

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

gulp.task('build', gulp.series(
  'themes',
  'hugo-build',
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
    ignoreInitial: false,
  };
  return gulp.watch(
    [path.join(__dirname, 'node_modules', '@gauntface/hugo-theme', '**', '*')],
    opts,
    gulp.series('themes', 'restart-server'),
  );
});

gulp.task('watch',
  gulp.series(
    'themes',
    gulp.parallel(
      'watch-gf-theme',
      'hugo-server',
    ),
  ),
);