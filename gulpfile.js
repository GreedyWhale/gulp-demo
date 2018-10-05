const path = require('path');
const gulp = require('gulp');
const del = require('del');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const jsonfile = require('jsonfile');
const replace = require('replace-in-file');
const newer = require('gulp-newer');
const watch = require('gulp-watch');

/* 
  node.js中的环境变量，可以手动修改
*/
const environment = process.env.NODE_ENV;
const config = {};

config.development = {
  appid: 'developmentAppid',
  buildPath: './build/development/',
  requestOrigin: 'https://developmentOrigin/',
  projectname: '开发环境'
}

config.staging = {
  appid: 'stagingAppid',
  buildPath: './build/staging/',
  requestOrigin: 'https://stagingOrigin/',
  projectname: '预发布环境'
}

config.production = {
  appid: 'productionAppid',
  buildPath: './build/production/',
  requestOrigin: 'https://productionOrigin/',
  projectname: '正式环境'
}

/*
  buildPath 打包后文件存放路径
  sourcePath 源代码路径
  configPath 小程序工具配置文件打包后存放路径
*/
const buildPath = path.join(__dirname, `${config[environment].buildPath}`);
const sourcePath = path.join(__dirname, '/src');
const configPath = path.join(buildPath, 'project.config.json');

function createConfigFile() {
  const { requestOrigin, appid, projectname } = config[environment];

  return replace({
    files: path.join(buildPath, '**/*'),
    from: [ /'API_BASE'/g ],
    to: [`'${requestOrigin}'`]
  })
    .then(() => {
      jsonfile.readFile(configPath, (error, oldFile) => {
        if (error) { oldFile = null };
        const fileContent = {
          appid,
          projectname,
          description: '项目配置文件',
          packOptions: { ignore: [] },
          setting: {
            urlCheck: true,
            es6: true,
            postcss: true,
            minified: true,
            newFeature: true
          },
          compileType: 'miniprogram',
          libVersion: '2.3.0',
          debugOptions: { hidedInDevtools: []},
          isGameTourist: false,
          condition: oldFile ? oldFile.condition : { search: { current: -1, list: [] },
          conversation: oldFile ? oldFile.conversation : { current: -1, list: []}, plugin: { current: -1, list: [] }, game: { currentL: -1,list: []},
          miniprogram: oldFile ? oldFile.miniprogram : {current: -1,list: [] } }
        }
        jsonfile.writeFile(configPath, fileContent, { spaces: 2 });
      })
    })
}

gulp.task('cleanBuildFolder', () => 
  del([
    `${buildPath}**/*`
  ])
);

gulp.task('moveSourceToBuildFolder', () =>
  gulp
    .src(`${sourcePath}/**/*.*`)
    .pipe(newer(buildPath))
    .pipe(gulp.dest(buildPath))
);

gulp.task('compileScss', () =>
  gulp
    .src(path.join(buildPath, '**/*.{sass,scss}'), { base: './' })
    .pipe(sass().on('error', sass.logError))
    .pipe(rename((file) => { file.extname = '.wxss' }))
    .pipe(gulp.dest('./'))
);

gulp.task('cleanUselessFile', () => 
  del([
    path.join(buildPath, './**/*.{sass,scss}'),
    path.join(buildPath, './**/*.md')
  ])
);

gulp.task('build', done => {
  createConfigFile()
    .then(done)
});

gulp.task('default', gulp.series(
  'cleanBuildFolder',
  'moveSourceToBuildFolder',
  'compileScss',
  'cleanUselessFile',
  'build',
  done => {
    done();
    console.log('编译完成');
    console.log(`当前环境为${environment}`);
  }
));

gulp.task('watch', gulp.series('default', () => 
  watch(`${sourcePath}/**/*.*`, gulp.series(
    'cleanBuildFolder',
    'moveSourceToBuildFolder',
    'compileScss',
    'cleanUselessFile'
  )))
)
