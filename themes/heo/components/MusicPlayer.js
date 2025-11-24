// components/MusicPlayer.js
import { useState, useEffect, useRef } from 'react'

export default function MusicPlayer() {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lyricsVisible, setLyricsVisible] = useState(true)
  const [currentLyric, setCurrentLyric] = useState('')
  const playerRef = useRef(null)
  const lyricsIntervalRef = useRef(null)

  const PLAYLIST_ID = '14148542684'

  // 动态加载资源
  useEffect(() => {
    const loadResources = async () => {
      // 加载 CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css'
      document.head.appendChild(link)

      // 加载 JS
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js'),
        loadScript('https://unpkg.com/meting@2.0.1/dist/Meting.min.js')
      ])

      initMeting()
    }

    loadResources()

    // 加载保存的设置
    const savedLyricsVisible = localStorage.getItem('lyricsVisible')
    if (savedLyricsVisible !== null) {
      setLyricsVisible(savedLyricsVisible === 'true')
    }

    return () => {
      if (lyricsIntervalRef.current) {
        clearInterval(lyricsIntervalRef.current)
      }
    }
  }, [])

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  const initMeting = () => {
    const aplayerContainer = document.getElementById('aplayer-container')
    if (!aplayerContainer) return

    aplayerContainer.innerHTML = ''
    const metingEl = document.createElement('meting-js')
    metingEl.setAttribute('server', 'netease')
    metingEl.setAttribute('type', 'playlist')
    metingEl.setAttribute('id', PLAYLIST_ID)
    metingEl.setAttribute('autoplay', 'false')
    metingEl.setAttribute('theme', '#49b1f5')
    metingEl.setAttribute('loop', 'all')
    metingEl.setAttribute('preload', 'auto')
    metingEl.setAttribute('lrctype', '1')
    aplayerContainer.appendChild(metingEl)

    // 监听播放器初始化
    const poll = setInterval(() => {
      if (metingEl.aplayer) {
        clearInterval(poll)
        playerRef.current = metingEl.aplayer
        bindAPlayerEvents(metingEl.aplayer)
      }
    }, 300)
  }

  const bindAPlayerEvents = (ap) => {
    if (!ap) return

    // 更新胶囊封面
    const updateCover = () => {
      try {
        const capsuleCover = document.getElementById('capsule-cover')
        const info = ap.list.audios[ap.list.index]
        if (info && info.cover && capsuleCover) {
          capsuleCover.src = info.cover
        }
      } catch(e) {}
    }

    ap.on('loadeddata', updateCover)
    ap.on('listswitch', updateCover)
    ap.on('play', () => {
      setIsPlaying(true)
      startLyricsUpdate()
    })
    ap.on('pause', () => {
      setIsPlaying(false)
      hideLyrics()
    })
    ap.on('ended', () => {
      hideLyrics()
    })
  }

  // 歌词功能
  const showLyricsWithEffect = (currentText, nextText) => {
    if (currentText === currentLyric) return
    setCurrentLyric(currentText)

    const currentLineEl = document.querySelector('#floating-lyrics .current-line')
    const nextLineEl = document.querySelector('#floating-lyrics .next-line')
    if (!currentLineEl || !nextLineEl) return

    currentLineEl.innerHTML = ''

    if (currentText && currentText.trim()) {
      const typingSpan = document.createElement('span')
      typingSpan.className = 'typing-text'
      typingSpan.textContent = currentText

      const fadeSpan = document.createElement('span')
      fadeSpan.className = 'fade-in-text'
      fadeSpan.textContent = currentText

      if (currentText.length > 15) {
        currentLineEl.appendChild(fadeSpan)
      } else {
        currentLineEl.appendChild(typingSpan)
      }

      nextLineEl.textContent = nextText || ''
      
      // 只有在歌词可见时才显示
      if (lyricsVisible) {
        document.getElementById('floating-lyrics').classList.add('show')
      }
    } else {
      hideLyrics()
    }
  }

  const startLyricsUpdate = () => {
    if (!lyricsVisible) {
      console.log('歌词已隐藏，跳过更新')
      return
    }

    if (lyricsIntervalRef.current) {
      clearInterval(lyricsIntervalRef.current)
    }

    lyricsIntervalRef.current = setInterval(() => {
      updateLyricsFromDOM()
    }, 100)
  }

  const updateLyricsFromDOM = () => {
    // 如果歌词不可见，直接返回
    if (!lyricsVisible) {
      return
    }

    try {
      const lrcContainer = document.querySelector('.aplayer-lrc')
      if (!lrcContainer) {
        hideLyrics()
        return
      }

      const currentLrc = lrcContainer.querySelector('p.aplayer-lrc-current')
      const allLrcLines = lrcContainer.querySelectorAll('p')

      if (currentLrc && currentLrc.textContent.trim()) {
        const currentText = currentLrc.textContent.trim()
        let nextText = ''

        for (let i = 0; i < allLrcLines.length; i++) {
          if (allLrcLines[i] === currentLrc && i < allLrcLines.length - 1) {
            nextText = allLrcLines[i + 1].textContent.trim()
            break
          }
        }

        showLyricsWithEffect(currentText, nextText)
      } else {
        hideLyrics()
        setCurrentLyric('')
      }
    } catch (error) {
      console.log('歌词更新错误:', error)
      hideLyrics()
      setCurrentLyric('')
    }
  }

  const hideLyrics = () => {
    const floatingLyrics = document.getElementById('floating-lyrics')
    if (floatingLyrics) {
      floatingLyrics.classList.remove('show')
    }
  }

  // 修复的歌词显示/隐藏控制函数
  const toggleLyricsVisibility = () => {
    const newLyricsVisible = !lyricsVisible
    setLyricsVisible(newLyricsVisible)
    
    console.log('切换歌词显示状态:', newLyricsVisible)

    // 立即更新歌词显示状态
    const floatingLyrics = document.getElementById('floating-lyrics')
    if (floatingLyrics) {
      if (newLyricsVisible) {
        floatingLyrics.classList.add('show')
        // 如果正在播放，重新开始歌词更新
        if (playerRef.current && !playerRef.current.audio.paused) {
          startLyricsUpdate()
        }
      } else {
        floatingLyrics.classList.remove('show')
        // 清除歌词内容
        const currentLineEl = document.querySelector('#floating-lyrics .current-line')
        const nextLineEl = document.querySelector('#floating-lyrics .next-line')
        if (currentLineEl) currentLineEl.textContent = ''
        if (nextLineEl) nextLineEl.textContent = ''
        setCurrentLyric('')
      }
    }

    // 更新菜单文本
    updateLyricsMenuText(newLyricsVisible)
    
    // 保存状态到本地存储
    localStorage.setItem('lyricsVisible', newLyricsVisible.toString())
  }

  // 更新歌词菜单文本
  const updateLyricsMenuText = (isVisible) => {
    const lyricsMenuItem = document.getElementById('menu-lyrics')
    if (lyricsMenuItem) {
      lyricsMenuItem.textContent = isVisible ? '📜 隐藏歌词' : '📜 显示歌词'
    }
  }

  // 右键菜单功能
  const showRightMenuAt = (clientX, clientY) => {
    const rightMenu = document.getElementById('right-menu')
    if (!rightMenu) return

    // 更新歌词菜单文本状态
    updateLyricsMenuText(lyricsVisible)

    rightMenu.style.display = 'block'
    rightMenu.classList.remove('show')

    requestAnimationFrame(() => {
      const mw = rightMenu.offsetWidth || 220
      const mh = rightMenu.offsetHeight || 280
      let left = Math.round(clientX - mw/2)
      left = Math.max(8, Math.min(left, window.innerWidth - mw - 8))
      let top = clientY - mh - 12
      if (top < 8) top = clientY + 12
      if (top + mh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - mh - 8)
      rightMenu.style.left = left + 'px'
      rightMenu.style.top = top + 'px'
      
      const arrowLeft = Math.max(12, Math.min(clientX - left, mw - 12))
      rightMenu.style.setProperty('--arrow-left', arrowLeft + 'px')
      rightMenu.classList.add('show')
    })
  }

  const hideRightMenuImmediate = () => {
    const rightMenu = document.getElementById('right-menu')
    if (rightMenu) {
      rightMenu.classList.remove('show')
      rightMenu.style.display = 'none'
    }
  }

  // 事件处理函数
  const handleCapsuleClick = () => {
    setIsPlayerVisible(true)
    const capsule = document.getElementById('music-capsule')
    const playerWrap = document.getElementById('player-wrap')
    if (capsule) capsule.style.display = 'none'
    if (playerWrap) playerWrap.classList.add('show')
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    showRightMenuAt(e.clientX, e.clientY)
  }

  const handleMenuAction = (action) => {
    switch(action) {
      case 'play':
        if (playerRef.current) playerRef.current.toggle()
        break
      case 'prev':
        if (playerRef.current) playerRef.current.skipBack()
        break
      case 'next':
        if (playerRef.current) playerRef.current.skipForward()
        break
      case 'volup':
        if (playerRef.current) {
          const currentVol = playerRef.current.audio.volume || 0.8
          playerRef.current.volume(Math.min(currentVol + 0.1, 1), true)
        }
        break
      case 'voldown':
        if (playerRef.current) {
          const currentVol = playerRef.current.audio.volume || 0.2
          playerRef.current.volume(Math.max(currentVol - 0.1, 0), true)
        }
        break
      case 'lyrics':
        toggleLyricsVisibility()
        break
      case 'support':
        window.open('https://1356666.xyz', '_blank')
        break
      case 'fullscreen':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        } else {
          document.exitFullscreen().catch(() => {})
        }
        break
      case 'close':
        if (playerRef.current) playerRef.current.pause()
        setIsPlayerVisible(false)
        setIsPlaying(false)
        const capsule = document.getElementById('music-capsule')
        const playerWrap = document.getElementById('player-wrap')
        if (capsule) capsule.style.display = 'flex'
        if (playerWrap) playerWrap.classList.remove('show')
        break
    }
    hideRightMenuImmediate()
  }

  // 添加全局事件监听
  useEffect(() => {
    const handleClickOutside = (e) => {
      const rightMenu = document.getElementById('right-menu')
      if (rightMenu && !rightMenu.contains(e.target)) {
        hideRightMenuImmediate()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // 初始化时更新歌词菜单文本
  useEffect(() => {
    updateLyricsMenuText(lyricsVisible)
  }, [lyricsVisible])

  return (
    <>
      {/* 独立歌词显示 */}
      <div id="floating-lyrics">
        <div className="current-line"></div>
        <div className="next-line"></div>
      </div>

      {/* 音乐胶囊 */}
      <div 
        id="music-capsule" 
        className={isPlaying ? 'playing' : ''}
        onClick={handleCapsuleClick}
        title="点击展开音乐播放器"
      >
        <img 
          id="capsule-cover" 
          src="https://p2.music.126.net/4HGEnXVexEfF2M4WdDdfrQ==/109951166354363385.jpg" 
          alt="capsule cover" 
        />
      </div>

      {/* 播放器容器 */}
      <div id="player-wrap" aria-hidden="true">
        <div id="aplayer-container"></div>
      </div>

      {/* 右键菜单 - 修复样式 */}
      <ul id="right-menu" role="menu" aria-hidden="true">
        <li onClick={() => handleMenuAction('play')}>▶ 播放 / 暂停</li>
        <li onClick={() => handleMenuAction('prev')}>⏮ 上一首</li>
        <li onClick={() => handleMenuAction('next')}>⏭ 下一首</li>
        <li onClick={() => handleMenuAction('volup')}>🔊 音量 +</li>
        <li onClick={() => handleMenuAction('voldown')}>🔉 音量 -</li>
        <li id="menu-lyrics" onClick={() => handleMenuAction('lyrics')}>
          {lyricsVisible ? '📜 隐藏歌词' : '📜 显示歌词'}
        </li>
        <li onClick={() => handleMenuAction('support')}>💡 技术支持</li>
        <li onClick={() => handleMenuAction('fullscreen')}>🖥️ 全屏模式</li>
        <li onClick={() => handleMenuAction('close')}>❌ 关闭播放器</li>
      </ul>

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

        /* ===== 独立歌词显示 ===== */
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

        #floating-lyrics .current-line {
          color: #ff4500;
          font-size: 30px;
          margin-bottom: 8px;
          font-weight: bold;
          min-height: 24px;
          overflow: hidden;
          position: relative;
        }

        #floating-lyrics .next-line {
          color: #ff8c00;
          font-size: 14px;
          opacity: 0.8;
          min-height: 18px;
        }

        #floating-lyrics .current-line .typing-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          animation: typing 2s steps(40, end), blink-caret 0.75s step-end infinite;
          border-right: 2px solid #ff4500;
          animation-fill-mode: both;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #ff4500 }
        }

        /* ===== 音乐胶囊 ===== */
        #music-capsule {
          position: fixed;
          left: 22px;
          bottom: 96px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 30000;
          background: radial-gradient(circle at 30% 30%, #00c3ff, #0061ff);
          box-shadow: 0 8px 28px rgba(0, 180, 255, 0.12);
        }

        #music-capsule.playing {
          background: radial-gradient(circle at 30% 30%, #ff9500, #ff5e00);
          box-shadow: 0 8px 28px rgba(255, 140, 0, 0.28);
        }

        #music-capsule.playing img {
          animation: spin 6s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0) }
          to { transform: rotate(360deg) }
        }

        #music-capsule img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        /* ===== 右键菜单 - 修复样式 ===== */
        #right-menu {
          position: fixed;
          display: none;
          z-index: 40000;
          min-width: 220px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #ff8c00; /* 橙色字体 */
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          padding: 6px 0;
          opacity: 0;
          transform: scale(.98);
          transition: opacity .12s, transform .12s;
        }

        #right-menu.show {
          display: flex;
          opacity: 1;
          transform: scale(1);
          flex-direction: column;
        }

        #right-menu li {
          list-style: none;
          padding: 10px 16px;
          cursor: pointer;
          white-space: nowrap;
          font-weight: 700;
          transition: background .12s, color .12s;
          color: #ff8c00; /* 橙色字体 */
        }

        #right-menu li:hover {
          background: #1e90ff; /* 蓝色背景 */
          color: white !important; /* 白色字体 */
          border-radius: 6px;
        }

        #right-menu::after {
          content: "";
          position: absolute;
          top: -8px;
          left: var(--arrow-left, 24px);
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid rgba(255, 255, 255, 0.12);
        }

        /* APlayer 自定义样式 */
        :global(.aplayer) {
          border-radius: 12px !important;
          overflow: hidden !important;
        }

        :global(.aplayer .aplayer-info .aplayer-music .aplayer-title) {
          color: #000 !important;
          font-weight: bold !important;
        }

        :global(.aplayer .aplayer-list ol li) {
          color: #000 !important;
        }

        :global(.aplayer .aplayer-lrc p) {
          color: #ff8c00 !important;
        }

        :global(.aplayer .aplayer-lrc p.aplayer-lrc-current) {
          color: #ff4500 !important;
          font-weight: bold !important;
          font-size: 16px !important;
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
          
          #music-capsule img {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </>
  )
}
