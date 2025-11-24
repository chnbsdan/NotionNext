<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>音乐播放器</title>
    <style>
        /* ===== 播放器面板（点击胶囊展开） ===== */
        #player-wrap {
            position: fixed;
            left: 18px;
            bottom: 92px;
            width: 360px;
            max-width: calc(100% - 36px);
            z-index: 15000;
            display: none;
            transform-origin: left bottom;
        }
        #player-wrap.show {
            display: block;
            animation: popIn .18s ease;
        }
        @keyframes popIn {
            from { opacity: 0; transform: scale(.96) }
            to { opacity: 1; transform: scale(1) }
        }

        /* APlayer 微调样式 - 自定义播放器外观 */
        .aplayer { 
            border-radius: 12px !important; 
            overflow: hidden !important; 
        }

        /* 顶部歌曲名改为黑色 */
        .aplayer .aplayer-info .aplayer-music .aplayer-title {
            color: #000 !important;
            font-weight: bold;
        }

        /* 播放列表歌名改为黑色 */
        .aplayer .aplayer-list ol li {
            color: #000 !important;
        }

        /* 歌词颜色设置 */
        .aplayer .aplayer-lrc p {
            color: #ff8c00 !important;
        }

        .aplayer .aplayer-lrc p.aplayer-lrc-current {
            color: #ff4500 !important;
            font-weight: bold;
            font-size: 16px;
        }

        /* ===== 独立歌词显示 - 新增逐步推进效果 ===== */
        #floating-lyrics {
            position: fixed;
            left: 100px; /*歌词到左边的距离*/
            bottom: 50px;
            text-align: left;
            z-index: 99999;
            color: #ff8c00;
            font-size: 18px;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.10);
            padding: 15px 20px;
            border-radius: 12px;
            backdrop-filter: blur(20px) saturate(180%);
            max-width: 400px;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
            pointer-events: none;
        }

        #floating-lyrics.show {
            opacity: 1;
        }

        /* 当前歌词行样式 */
        #floating-lyrics .current-line {
            color: #ff4500;
            font-size: 30px; /*歌词字大小调节*/
            margin-bottom: 8px;
            font-weight: bold;
            min-height: 24px;
            overflow: hidden;
            position: relative;
        }

        /* 下一句歌词样式 */
        #floating-lyrics .next-line {
            color: #ff8c00;
            font-size: 14px;
            opacity: 0.8;
            min-height: 18px;
        }

        /* 逐字推进效果 */
        #floating-lyrics .current-line .typing-text {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            animation: typing 2s steps(40, end), blink-caret 0.75s step-end infinite;
            border-right: 2px solid #ff4500; /* 打字光标 */
            animation-fill-mode: both;
        }

        /* 打字机效果动画 */
        @keyframes typing {
            from { width: 0 }
            to { width: 100% }
        }

        @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: #ff4500 }
        }

        /* 淡入效果 */
        .fade-in-text {
            animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ===== 音乐胶囊（固定左下） ===== */
        #music-capsule{
            position:fixed;
            left:22px;
            bottom:96px;
            width:72px;
            height:72px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            z-index:30000;
            background:radial-gradient(circle at 30% 30%, #00c3ff,#0061ff);
            box-shadow:0 8px 28px rgba(0,180,255,0.12)
        }

        #music-capsule.playing{
            background:radial-gradient(circle at 30% 30%, #ff9500,#ff5e00);
            box-shadow:0 8px 28px rgba(255,140,0,0.28)
        }

        #music-capsule.playing img{
            animation:spin 6s linear infinite
        }

        @keyframes spin{
            from{transform:rotate(0)}
            to{transform:rotate(360deg)}
        }

        /* ===== 右键菜单（毛玻璃半透明） ===== */
        #right-menu{
            position:fixed;
            display:none;
            z-index:40000;
            min-width:220px;
            background:rgba(255,255,255,0.12);
            backdrop-filter:blur(10px);
            -webkit-backdrop-filter:blur(10px);
            color:#ff8c00; /* 橙色字体 */
            border-radius:10px;
            box-shadow:0 10px 30px rgba(0,0,0,0.35);
            padding:6px 0;
            opacity:0;
            transform:scale(.98);
            transition:opacity .12s,transform .12s
        }

        #right-menu.show{
            display:flex;
            opacity:1;
            transform:scale(1);
            flex-direction:column
        }

        #right-menu li{
            list-style:none;
            padding:10px 16px;
            cursor:pointer;
            white-space:nowrap;
            font-weight:700;
            transition:background .12s, color .12s;
            color:#ff8c00; /* 橙色字体 */
        }

        #right-menu li:hover{
            background:#1e90ff; /* 蓝色背景 */
            color:white !important; /* 白色字体 */
            border-radius:6px
        }

        /* 右键菜单箭头 */
        #right-menu::after{
            content:"";
            position:absolute;
            top:-8px;
            left:var(--arrow-left,24px);
            transform:translateX(-50%);
            border-left:8px solid transparent;
            border-right:8px solid transparent;
            border-bottom:8px solid rgba(255,255,255,0.12)
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            #player-wrap {
                left: 10px;
                bottom: 80px;
                width: calc(100% - 20px);
            }
            
            #floating-lyrics {
                left: 20px;
                right: 20px;
                bottom: 70px;
                max-width: none;
            }
            
            #music-capsule {
                left: 15px;
                bottom: 80px;
                width: 60px;
                height: 60px;
            }
        }
    </style>
</head>
<body>
    <!-- APlayer 样式（用于 Meting.js 渲染 APlayer） -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">

    <!-- 独立歌词显示 -->
    <div id="floating-lyrics">
        <div class="current-line"></div>
        <div class="next-line"></div>
    </div>

    <!-- 音乐胶囊 - 点击展开播放器 -->
    <div id="music-capsule" title="点击展开音乐播放器">
        <img id="capsule-cover" src="https://p2.music.126.net/4HGEnXVexEfF2M4WdDdfrQ==/109951166354363385.jpg" alt="capsule cover">
    </div>

    <!-- 播放器容器（Meting 会在这里渲染 APlayer） -->
    <div id="player-wrap" aria-hidden="true">
        <div id="aplayer-container"></div>
    </div>

    <!-- 右键菜单（毛玻璃效果） -->
    <ul id="right-menu" role="menu" aria-hidden="true">
        <li id="menu-play">▶ 播放 / 暂停</li>
        <li id="menu-prev">⏮ 上一首</li>
        <li id="menu-next">⏭ 下一首</li>
        <li id="menu-volup">🔊 音量 +</li>
        <li id="menu-voldown">🔉 音量 -</li>
        <li id="menu-lyrics">📜 显示/隐藏歌词</li>
        <li id="menu-support">💡 技术支持</li>
        <li id="menu-fullscreen">🖥️ 全屏模式</li>
        <li id="menu-close">❌ 关闭播放器</li>
    </ul>

    <!-- Meting + APlayer 脚本 -->
    <script src="https://unpkg.com/meting@2.0.1/dist/Meting.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>

    <script>
        /* ====================== 音乐播放器配置 ====================== */
        // 网易云歌单 ID
        const PLAYLIST_ID = '14148542684';

        /* ======= DOM 元素引用 ======= */
        const capsule = document.getElementById('music-capsule');
        const capsuleCover = document.getElementById('capsule-cover');
        const playerWrap = document.getElementById('player-wrap');
        const aplayerContainer = document.getElementById('aplayer-container');
        const rightMenu = document.getElementById('right-menu');
        const floatingLyrics = document.getElementById('floating-lyrics');
        const currentLineEl = floatingLyrics.querySelector('.current-line');
        const nextLineEl = floatingLyrics.querySelector('.next-line');

        let metingEl = null;
        let aplayer = null;
        let lyricsInterval = null;
        let currentLyric = ''; // 用于跟踪当前歌词，避免重复触发动画
        let lyricsVisible = true; // 歌词显示状态

        /* ===== 独立歌词显示功能 ===== */

        // 新的歌词显示方法 - 带逐步推进效果
        function showLyricsWithEffect(currentText, nextText) {
            // 如果歌词没有变化，不重复触发动画
            if (currentText === currentLyric) return;
            
            currentLyric = currentText;
            
            // 清除当前行的内容
            currentLineEl.innerHTML = '';
            
            if (currentText && currentText.trim()) {
                // 创建打字机效果的文本容器
                const typingSpan = document.createElement('span');
                typingSpan.className = 'typing-text';
                typingSpan.textContent = currentText;
                
                // 创建淡入效果的文本容器（备用）
                const fadeSpan = document.createElement('span');
                fadeSpan.className = 'fade-in-text';
                fadeSpan.textContent = currentText;
                
                // 根据歌词长度决定使用哪种效果
                if (currentText.length > 15) {
                    // 长歌词使用淡入效果
                    currentLineEl.appendChild(fadeSpan);
                } else {
                    // 短歌词使用打字机效果
                    currentLineEl.appendChild(typingSpan);
                }
                
                // 设置下一句歌词
                nextLineEl.textContent = nextText || '';
                
                // 只有在歌词可见时才显示容器
                if (lyricsVisible) {
                    floatingLyrics.classList.add('show');
                }
            } else {
                // 没有歌词时隐藏
                floatingLyrics.classList.remove('show');
            }
        }

        // 歌词更新方法 - 通过定时器检查DOM元素
        function startLyricsUpdate(ap) {
            console.log('开始歌词更新监听');
            
            // 如果歌词不可见，不启动更新
            if (!lyricsVisible) {
                console.log('歌词已隐藏，跳过更新');
                return;
            }
            
            // 清除之前的定时器
            if (lyricsInterval) {
                clearInterval(lyricsInterval);
            }
            
            // 设置定时器检查歌词
            lyricsInterval = setInterval(() => {
                updateLyricsFromDOM();
            }, 100);
        }

        function updateLyricsFromDOM() {
            // 如果歌词不可见，直接返回并确保隐藏
            if (!lyricsVisible) {
                floatingLyrics.classList.remove('show');
                return;
            }
            
            try {
                // 查找APlayer的歌词元素
                const lrcContainer = document.querySelector('.aplayer-lrc');
                if (!lrcContainer) {
                    console.log('未找到歌词容器');
                    floatingLyrics.classList.remove('show');
                    return;
                }
                
                // 获取当前歌词和下一句歌词
                const currentLrc = lrcContainer.querySelector('p.aplayer-lrc-current');
                const allLrcLines = lrcContainer.querySelectorAll('p');
                
                if (currentLrc && currentLrc.textContent.trim()) {
                    const currentText = currentLrc.textContent.trim();
                    let nextText = '';
                    
                    // 找到下一句歌词
                    for (let i = 0; i < allLrcLines.length; i++) {
                        if (allLrcLines[i] === currentLrc && i < allLrcLines.length - 1) {
                            nextText = allLrcLines[i + 1].textContent.trim();
                            break;
                        }
                    }
                    
                    // 使用新的歌词显示方法
                    showLyricsWithEffect(currentText, nextText);
                } else {
                    console.log('没有找到当前歌词');
                    floatingLyrics.classList.remove('show');
                    currentLyric = ''; // 重置当前歌词跟踪
                }
            } catch (error) {
                console.log('歌词更新错误:', error);
                floatingLyrics.classList.remove('show');
                currentLyric = ''; // 重置当前歌词跟踪
            }
        }

        // 歌词显示/隐藏控制函数 - 修复版本
        function toggleLyricsVisibility() {
            lyricsVisible = !lyricsVisible;
            
            console.log('切换歌词显示状态:', lyricsVisible); // 调试日志
            
            if (lyricsVisible) {
                // 显示歌词
                floatingLyrics.classList.add('show');
                // 如果正在播放，重新开始歌词更新
                if (aplayer && !aplayer.audio.paused) {
                    startLyricsUpdate(aplayer);
                }
            } else {
                // 隐藏歌词
                floatingLyrics.classList.remove('show');
                // 清除歌词内容
                currentLineEl.textContent = '';
                nextLineEl.textContent = '';
                currentLyric = ''; // 重置当前歌词跟踪
                
                // 停止歌词更新定时器
                if (lyricsInterval) {
                    clearInterval(lyricsInterval);
                    lyricsInterval = null;
                }
            }
            
            // 更新菜单文本
            const lyricsMenuItem = document.getElementById('menu-lyrics');
            lyricsMenuItem.textContent = lyricsVisible ? '📜 隐藏歌词' : '📜 显示歌词';
            
            // 保存状态到本地存储
            localStorage.setItem('lyricsVisible', lyricsVisible.toString());
        }

        /* ================= 初始化 Meting + APlayer（音乐） ================= */
        function initMeting(){
            if (aplayer) return Promise.resolve(aplayer);
            return new Promise((resolve, reject) => {
                // 如果已经渲染好则直接返回
                if (metingEl && metingEl.aplayer) {
                    aplayer = metingEl.aplayer;
                    bindAPlayerEvents(aplayer);
                    return resolve(aplayer);
                }

                // 创建 meting-js 并加入 DOM
                aplayerContainer.innerHTML = '';
                metingEl = document.createElement('meting-js');
                metingEl.setAttribute('server', 'netease');
                metingEl.setAttribute('type', 'playlist');
                metingEl.setAttribute('id', PLAYLIST_ID);
                metingEl.setAttribute('autoplay', 'false');
                metingEl.setAttribute('theme', '#49b1f5');
                metingEl.setAttribute('loop', 'all');
                metingEl.setAttribute('preload', 'auto');
                metingEl.setAttribute('lrctype', '1');
                aplayerContainer.appendChild(metingEl);

                // 轮询或等待 rendered 事件
                let handled = false;
                function tryResolve(){
                    if (handled) return;
                    if (metingEl && metingEl.aplayer) {
                        aplayer = metingEl.aplayer;
                        handled = true;
                        bindAPlayerEvents(aplayer);
                        resolve(aplayer);
                    }
                }
                metingEl.addEventListener('rendered', tryResolve);
                const poll = setInterval(()=>{ tryResolve(); if(handled) clearInterval(poll); }, 300);
                setTimeout(()=>{ if(!handled){ clearInterval(poll); reject(new Error('APlayer 初始化超时')); }}, 9000);
            });
        }

        /* 绑定 APlayer 事件（更新封面、旋转状态、歌词滚动等） */
        function bindAPlayerEvents(ap){
            if (!ap) return;
            
            // 更新胶囊封面
            function updateCover(){
                try {
                    const info = ap.list.audios[ap.list.index];
                    if (info && info.cover) capsuleCover.src = info.cover;
                } catch(e){}
            }
            
            ap.on('loadeddata', updateCover);
            ap.on('listswitch', updateCover);
            ap.on('play', ()=> {
                capsule.classList.add('playing');
                // 开始监听歌词
                startLyricsUpdate(ap);
            });
            ap.on('pause', ()=> {
                capsule.classList.remove('playing');
                // 暂停时隐藏歌词
                floatingLyrics.classList.remove('show');
                currentLyric = ''; // 重置当前歌词跟踪
            });
            ap.on('ended', ()=> {
                floatingLyrics.classList.remove('show');
                currentLyric = ''; // 重置当前歌词跟踪
            });
        }

        /* helper：确保播放器就绪后执行操作 */
        async function ensurePlayerAndRun(fn){
            try {
                const ap = await initMeting();
                if (typeof fn === 'function') fn(ap);
            } catch(err){
                console.warn('播放器未就绪：', err);
            }
        }

        /* 点击胶囊：隐藏胶囊、显示播放器（异步初始化播放器） */
        capsule.addEventListener('click', ()=>{
            capsule.style.display = 'none';
            playerWrap.classList.add('show');
            initMeting().catch(()=>{ /* ignore */ });
        });

        /* ================== 右键菜单功能 ================== */
        /* showRightMenuAt：固定定位（clientX/Y），并防止被底部任务栏遮挡 */
        function showRightMenuAt(clientX, clientY){
            rightMenu.style.display = 'block';
            rightMenu.classList.remove('show');
            requestAnimationFrame(()=>{
                const mw = rightMenu.offsetWidth || 220;
                const mh = rightMenu.offsetHeight || 280;
                let left = Math.round(clientX - mw/2);
                left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
                let top = clientY - mh - 12;
                if (top < 8) top = clientY + 12;
                if (top + mh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - mh - 8);
                rightMenu.style.left = left + 'px';
                rightMenu.style.top = top + 'px';
                // 箭头位置
                const arrowLeft = Math.max(12, Math.min(clientX - left, mw - 12));
                rightMenu.style.setProperty('--arrow-left', arrowLeft + 'px');
                rightMenu.classList.add('show');
            });
        }

        /* 绑定右键事件：显示菜单并阻止默认菜单 */
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showRightMenuAt(e.clientX, e.clientY);
        });

        /* 点击空白处或触摸空白处立即隐藏菜单 */
        function hideRightMenuImmediate(){
            rightMenu.classList.remove('show');
            rightMenu.style.display = 'none';
        }
        document.addEventListener('click', (e) => {
            if (!rightMenu.contains(e.target)) hideRightMenuImmediate();
        });
        document.addEventListener('touchstart', (e) => {
            if (!rightMenu.contains(e.target)) hideRightMenuImmediate();
        });

        /* 菜单功能：点击后立即执行并隐藏菜单 */
        document.getElementById('menu-play').addEventListener('click', ()=>{ ensurePlayerAndRun(ap=>ap.toggle()); hideRightMenuImmediate(); });
        document.getElementById('menu-prev').addEventListener('click', ()=>{ ensurePlayerAndRun(ap=>ap.skipBack()); hideRightMenuImmediate(); });
        document.getElementById('menu-next').addEventListener('click', ()=>{ ensurePlayerAndRun(ap=>ap.skipForward()); hideRightMenuImmediate(); });
        document.getElementById('menu-volup').addEventListener('click', ()=>{ ensurePlayerAndRun(ap=>ap.volume(Math.min((ap.audio.volume||0.8)+0.1,1), true)); hideRightMenuImmediate(); });
        document.getElementById('menu-voldown').addEventListener('click', ()=>{ ensurePlayerAndRun(ap=>ap.volume(Math.max((ap.audio.volume||0.2)-0.1,0), true)); hideRightMenuImmediate(); });

        // 歌词控制菜单项
        document.getElementById('menu-lyrics').addEventListener('click', ()=>{
            toggleLyricsVisibility();
            hideRightMenuImmediate();
        });

        document.getElementById('menu-support').addEventListener('click', ()=>{ window.open('https://1356666.xyz','_blank'); hideRightMenuImmediate(); });

        document.getElementById('menu-fullscreen').addEventListener('click', ()=>{
            hideRightMenuImmediate();
            // 整个页面进入全屏
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(()=>{});
            } else {
                document.exitFullscreen().catch(()=>{});
            }
        });

        document.getElementById('menu-close').addEventListener('click', ()=>{
            ensurePlayerAndRun(ap=>ap.pause());
            playerWrap.classList.remove('show');
            capsule.style.display = 'flex';
            hideRightMenuImmediate();
        });

        /* 预初始化 APlayer（使菜单能立即使用） */
        initMeting().then(ap=>{
            console.log('APlayer初始化完成');
        }).catch(()=>{
            console.log('APlayer初始化失败');
        });

        // 页面加载完成后初始化歌词显示状态
        document.addEventListener('DOMContentLoaded', function() {
            // 从本地存储读取歌词显示状态
            const savedLyricsVisible = localStorage.getItem('lyricsVisible');
            if (savedLyricsVisible !== null) {
                lyricsVisible = savedLyricsVisible === 'true';
            }
            
            // 根据状态更新菜单文本
            const lyricsMenuItem = document.getElementById('menu-lyrics');
            lyricsMenuItem.textContent = lyricsVisible ? '📜 隐藏歌词' : '📜 显示歌词';
            
            // 如果歌词应该隐藏，立即隐藏
            if (!lyricsVisible) {
                floatingLyrics.classList.remove('show');
            }
        });
    </script>
</body>
</html>
