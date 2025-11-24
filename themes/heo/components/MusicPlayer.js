import { useEffect, useRef, useState } from 'react'

export default function MusicPlayer() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    
    // 只在客户端执行
    if (typeof window !== 'undefined') {
      // 动态加载外部CSS和JS
      loadExternalResources()
      initializePlayer()
    }
    
    return () => {
      // 清理工作
      const lyricsInterval = window._lyricsInterval
      if (lyricsInterval) clearInterval(lyricsInterval)
    }
  }, [])

  const loadExternalResources = () => {
    // 动态加载APlayer CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css'
    document.head.appendChild(link)
    
    // 动态加载Meting JS
    const metingScript = document.createElement('script')
    metingScript.src = 'https://unpkg.com/meting@2.0.1/dist/Meting.min.js'
    document.body.appendChild(mingScript)
    
    // 动态加载APlayer JS
    const aplayerScript = document.createElement('script')
    aplayerScript.src = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js'
    document.body.appendChild(aplayerScript)
  }

  if (!isMounted) {
    return null
  }

  return (
    <>
      <style jsx>{`
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
          left: 100px;
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
          font-size: 30px;
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
          border-right: 2px solid #ff4500;
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
          color:#ff8c00;
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
          color:#ff8c00;
        }

        #right-menu li:hover{
          background:#1e90ff;
          color:white !important;
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
      `}</style>

      {/* 独立歌词显示 */}
      <div id="floating-lyrics">
        <div className="current-line"></div>
        <div className="next-line"></div>
      </div>

      {/* 音乐胶囊 - 点击展开播放器 */}
      <div id="music-capsule" title="点击展开音乐播放器">
        <img id="capsule-cover" src="https://p2.music.126.net/4HGEnXVexEfF2M4WdDdfrQ==/109951166354363385.jpg" alt="capsule cover" />
      </div>

      {/* 播放器容器（Meting 会在这里渲染 APlayer） */}
      <div id="player-wrap" aria-hidden="true">
        <div id="aplayer-container"></div>
      </div>

      {/* 右键菜单（毛玻璃效果） */}
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
    </>
  )
}

// 将原来的JavaScript代码放在单独的文件中或使用useEffect
const initializePlayer = () => {
  // 这里放置您原来的所有JavaScript代码
  // 由于代码较长，建议创建一个单独的player.js文件
  // 然后在useEffect中动态加载
}
