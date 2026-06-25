// Suppress Node deprecation warnings about child process spawning with shell: true
process.noDeprecation = true;

const { spawn } = require('child_process');

const child = spawn('npx', ['vercel', 'dev', '--yes'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
