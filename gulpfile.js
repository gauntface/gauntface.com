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

gulp.task('build', async () => {
  console.log('TODO: Build hugo site');
})

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

gulp.task('hugo-server', startServer);

gulp.task('restart-server', async () => {
  if (!serverInstance) {
    return;
  }

  serverInstance.kill();
});

gulp.task('watch',
  gulp.series(
    'themes',
    'hugo-server',
  ),
);