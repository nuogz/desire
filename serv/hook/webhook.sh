date +"%y-%m-%d %H:%M:%S" 1>~/logs/kq/bsh.log

fr stop /root/serv/index.js 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log

cd ~/serv/serv/kq

git clean -fd 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log
git checkout -- . 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log
git pull github master 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log

cd ~/serv

git clean -fd 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log
git checkout -- . 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log
git pull github master 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log
npm i 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log

fr start -o ~/logs/kq/out.log -e ~/logs/kq/err.log /root/serv/index.js 1>>~/logs/kq/bsh.log 2>>~/logs/kq/bsh.log