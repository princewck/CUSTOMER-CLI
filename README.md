[TOC]

## nodejs: 命令行工具开发

### 预备知识

#### process 全局对象介绍和使用

> `process` 对象是一个全局变量，它提供当前 Node.js 进程的有关信息，以及控制当前 Node.js 进程。 因为是全局变量，所以无需使用 `require()`。http://nodejs.cn/api/process.html#process_process



编写一个nodejs命令行工具，process对象我们比较常用到的功能：

- process.argv 属性

  > `process.argv` 属性返回一个数组，这个数组包含了启动Node.js进程时的命令行参数。第一个元素为[`process.execPath`](http://nodejs.cn/s/MCrAya)。如果需要获取`argv[0]`的值请参见 `process.argv0`。第二个元素为当前执行的JavaScript文件路径。剩余的元素为其他命令行参数。

- process.env 属性: 设定和获取环境变量

  > `process.env`属性返回一个包含用户环境信息的对象 

  > 什么是环境变量：它是一组键值对，进程可以使用它们来调整自己的行为。e.g 所有操作系统都定义了一个文件路径清单的环境变量PATH，用来根据名称搜索程序的位置（比如ls被解析为/bin/bash）

  ```
  # 命令行指定要启动的进程中env对象属性

  $ NODE_ENV=production node
  # or
  $ env NODE_ENV=production node
  ```

- fs 模块：

  fs模块提供了跟文件系统交互的函数，其中大部分都有一一对应的C函数，几乎所有底层函数的用法都和C函数用法一样，比如fs.stat() 和 fs.statSync() 是C 函数stat()的底层绑定。

  - 同步和异步api？

    > Q：如你所知， Nodejs的API大部分是异步函数，从不阻塞事件循环，那为何还要引入这些文件系统函数的同步版本呢？
    >
    > A：因为Node自己的require()函数是同步的，并且它的实现用到了fs模块的函数，所以必须有同步版本。

  - 移动文件

    移动文件是很常见的文件系统交互任务，在unix平台上用mv命令，windows上是move.而在Node中，可以使用fs.rename()函数，它直接对应C函数的rename(), 但是它有一个怪毛病，它不能跨越物理设备（比如两个硬盘）复制：

    ```
    fs.rename('C:\\hello.txt', 'D:\\hello.txt', err => {
        // err.code === 'EXDEV';
    })
    ```

    了解这一点后，我们可以创建一个优化后的move函数，可能时调用快速的fs.rename()， 必要时用fs.ReadStream和fs.WriteStream在不同设备间复制文件。

- child_process模块，子进程

  - cp.fork()
  - process.send

- 捕获发送给进程的信号

  UNIX有信号的概念，是进程间通信(IPC)的基本形式。这些信号非常原始，只能使用一组固定的名称，且不支持传递参数。

  Node提供了一些信号的默认行为：

  - `SIGINT` 按下 Ctrl+C时由shell发送，Node 的默认行为是杀掉进程，但该行为可以由进程上的SIGNIT单例监听器覆盖；
  - `SIGUSR1` 收到这个信号时，Node会进入它内置的调试器；
  - `SIGWINCH` 在调整中端大小时由shell发送，收到这个信号时，Node会重新设定`process.stdout.rows`和`process.stdout.columns`,并发出一个resize事件。

   这些是Node对三个信号的默认处理，你可以在process对象上监听这些信号，调用回调函数。

  > 假设你写了个服务器，但在按下Ctrl + C 时要杀掉服务器，这种关闭不干净，并且所有等待中的连接都会丢失。解决办法是捕获SIGNIT信号并阻止服务器接受连接，并在结束进程前把等待中的连接处理完毕。

  ```javascript
  process.on('SIGNIT', () => {
      console.log('Got Ctrl+C!');
      server.close();
  })
  ```

### 1. 创建一个可执行的js文件

- chmod +x [file]

- 丢掉`node` 命令运行文件

  > #!/usr/bin/env node

- 执行时不需要指定路径

  - 复制文件或者创建连接到系统环境变量指定的路径(`/usr/local/bin`)下

### 2. 解析命令行参数

- process.argv

```bash
$node ./cmd.js verbose
```

```
// ./cmd.js
const [nodePath, scriptPath, verbose:logLevel] = process.argv;
console.log(logLevel); // 'verbose'
```

- commander.js  http://tj.github.io/commander.js/
- args <https://npmjs.com/args>
- vorpal https://github.com/dthree/vorpal



例子：

```javascript
 program
   .version('0.0.1')
   .option('-C, --chdir <path>', 'change the working directory')
   .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
   .option('-T, --no-tests', 'ignore test hook')

 program
   .command('setup')
   .description('run remote setup commands')
   .action(function() {
     console.log('setup');
   });

 program
   .command('exec <cmd>')
   .description('run the given remote command')
   .action(function(cmd) {
     console.log('exec "%s"', cmd);
   });

 program
   .command('teardown <dir> [otherDirs...]')
   .description('run teardown commands')
   .action(function(dir, otherDirs) {
     console.log('dir "%s"', dir);
     if (otherDirs) {
       otherDirs.forEach(function (oDir) {
         console.log('dir "%s"', oDir);
       });
     }
   });

 program
   .command('*')
   .description('deploy the given env')
   .action(function(env) {
     console.log('deploying "%s"', env);
   });

 program.parse(process.argv);
```



e.g

```javascript
// cmd.js
program
.command('update')
// .command('update <_id>')
.parseExpectedArgs(['<_id>', '[_name]']) // 效果同上一行
.alias('u')
.description('update a customer')
.option('-l,--loglevel [verbose|debug|error]', '设定日志级别')
.usage('<id> -l <loglevel>')
.action(((_id, _name, {loglevel}) => {
	console.log(_id, _name, loglevel);
}))
.parse(process.argv);
```

```bash
$cmd u --help

# =>
# Usage: update|u  <id> -l [verbose|debug|error]
#
# update a customer
#
# Options:
#
#   -l,--loglevel <level>  设定日志级别
#   -h, --help             output usage information

$cmd u -l DEBUG id_1234 wangck
# => id_1234 wangck DEBUG
```

### 3. 处理stdin 和 stdout

Node提供了两个Stream对象来处理程序的输入和输出：

- `process.stdin`   读取输入数据的ReadStream
- `process.stdout` 读取输出数据的WriteStream

##### process.stdout 写输出数据

当每次调用console.log时已经隐含了对process.stdout的使用了，`console.log`函数内部在格式化输出参数后调用了`process.stdout.write()`。但console.log()更多的是用来调试和检查对象的，当需要将结构化的数据写到stdout时，可以使用`process.stdout.write()`。

`e.g`

```javascript
var http = require('http');
var url = require('url');

var target = url.parse(process.argv[2]);
var req = http.get(target, res => {
   res.pipe(process.stdout);
});
```

> 我们实现了一个微型的curl

##### process.stdin读取输入数据

```javascript
const requiredAge = 18;

process.stdout.write('请输入你的年龄：');
process.stdin.setEncoding('utf8');

process.stdin.on('data', data => {
  const age = parseInt(data, 10);
  if (isNaN(age)) {
    console.log('%s is not a valid number', data);
  } else if (age < requiredAge) {
    console.log('你必须年满 %d 周岁才可以查看内容，' +
      '%d 年后再来吧！',
      requiredAge,
      requiredAge - age
    );
  } else {
    console.log('欢迎使用！！！');
  }
  process.stdin.pause();
});

process.stdin.resume();
```

>  使用inquirer 模块可以帮助我们更优雅地处理输入数据

```
var inquirer = require('inquirer');
inquirer
  .prompt([
    /* Pass your questions in here */
  ])
  .then(answers => {
    // Use user feedback for... whatever!!
  });
```

### 4. 添加彩色的输出

很多命令行程序都会使用彩色文本，让屏幕上的内容更容易区分。Node自己的REPL就是这样的，npm各种日志级别也是这样的。这是一个所有命令行程序都能从中受益的奖励特性，并且给程序添加彩色输出相当容易，特别是在有社区模块的支持时。

#### 终端中的颜色其实是特殊的文本序列产生的

终端中的颜色是由ANSI转义码产生的，这些转译码只是写到stdout中的简单文本序列，对终端有特殊的含义——包括改变颜色，光标位置，发出蜂鸣音等。

```javascript
// 输出绿色的'hello'
console.log('\033[32mhello\033[39m');
```

https://blog.csdn.net/ShewMi/article/details/78992458

#### 社区模块支持

- color.js https://github.com/Marak/colors.js

```javascript
var colors = require('colors');

console.log('hello'.green); // outputs green text
console.log('i like cake and pies'.underline.red) // outputs red underlined text
console.log('inverse the color'.inverse); // inverses the color
console.log('OMG Rainbows!'.rainbow); // rainbow
console.log('Run the trap'.trap); // Drops the bass

// 支持自定义规则
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

// outputs red text
console.log("this is an error".error);
```

- ansi.js https://github.com/TooTallNate/ansi.js

  ```javascript
  var ansi = require('ansi')
    , cursor = ansi(process.stdout)

  // You can chain your calls forever:
  cursor
    .red()                 // Set font color to red
    .bg.grey()             // Set background color to grey
    .write('Hello World!') // Write 'Hello World!' to stdout
    .bg.reset()            // Reset the bgcolor before writing the trailing \n,
                           //      to avoid Terminal glitches
    .write('\n')           // And a final \n to wrap things up

  // Rendering modes are persistent:
  cursor.hex('#660000').bold().underline()

  // You can use the regular logging functions, text will be green:
  console.log('This is blood red, bold text')

  // To reset just the foreground color:
  cursor.fg.reset()

  console.log('This will still be bold')

  // to go to a location (x,y) on the console
  // note: 1-indexed, not 0-indexed:
  cursor.goto(10, 5).write('Five down, ten over')

  // to clear the current line:
  cursor.horizontalAbsolute(0).eraseLine().write('Starting again')

  // to go to a different column on the current line:
  cursor.horizontalAbsolute(5).write('column five')

  // Clean up after yourself!
  cursor.reset()
  ```

- chalk https://github.com/chalk/chalk

```javascript
const chalk = require('chalk');
const log = console.log;

// Combine styled and normal strings
log(chalk.blue('Hello') + ' World' + chalk.red('!'));

// Compose multiple styles using the chainable API
log(chalk.blue.bgRed.bold('Hello world!'));

// Pass in multiple arguments
log(chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// Nest styles
log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'));

// Nest styles of the same type even (color, underline, background)
log(chalk.green(
	'I am a green line ' +
	chalk.blue.underline.bold('with a blue substring') +
	' that becomes green again!'
));

// ES2015 template literal
log(`
CPU: ${chalk.red('90%')}
RAM: ${chalk.green('40%')}
DISK: ${chalk.yellow('70%')}
`);

// ES2015 tagged template literal
log(chalk`
CPU: {red ${cpu.totalPercent}%}
RAM: {green ${ram.used / ram.total * 100}%}
DISK: {rgb(255,131,0) ${disk.used / disk.total * 100}%}
`);

// Use RGB colors in terminal emulators that support it.
log(chalk.keyword('orange')('Yay for orange colored text!'));
log(chalk.rgb(123, 45, 67).underline('Underlined reddish color'));
log(chalk.hex('#DEADED').bold('Bold gray!'));

// 自定义规则
const error = chalk.bold.red;
const warning = chalk.keyword('orange');

console.log(error('Error!'));
console.log(warning('Warning!'));

// 背景色
chalk.bgHex('#DEADED').underline('Hello, world!')
chalk.bgKeyword('orange')('Some orange text')
chalk.bgRgb(15, 100, 204).inverse('Hello!')
```

- 其他
  - terminal-link 创建可点击的连接
  - gradient-string 创建渐变色的字符串
  - chalk-animation 字符串动画

### 5. 发布和安装

- /usr/bin/env

  > ! /usr/local/bin/node  和 /usr/bin/env node 的区别 ？

- package.json  `bin` 属性

```bash
╰─λ npm link
npm WARN customer-cli@1.0.0 No description
npm WARN customer-cli@1.0.0 No repository field.

up to date in 1.195s
/usr/local/bin/customer-cli -> /usr/local/lib/node_modules/customer-cli/commands.js
/usr/local/lib/node_modules/customer-cli -> /Users/wangchengkai/projects/customer-cli
```

- npm link 做了什么？ https://docs.npmjs.com/cli/link

> First, `npm link` in a package folder will create a symlink in the global folder`{prefix}/lib/node_modules/<package>` that links to the package where the `npm link` command was executed. (see `npm-config` for the value of `prefix`). It will also link any bins in the package to `{prefix}/bin/{name}`.

### 6. 社区模块

- dotenv  https://github.com/motdotla/dotenv
- nconf https://github.com/indexzero/nconf
- fstream https://github.com/npm/fstream
- fs-extra https://github.com/jprichardson/node-fs-extra
- shelljs https://github.com/shelljs/shelljs
- ora https://github.com/sindresorhus/ora

> 参考
>
> - Creating Node.js Command Line Utilities to Improve Your Workflow
>  https://developer.telerik.com/featured/creating-node-js-command-line-utilities-improve-workflow/
>
> - How to build a command-line app in Node.js using TypeScript, Google Cloud Functions and Firebase https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27
>

