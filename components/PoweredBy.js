export default function PoweredBy(props) {
  return (
    <div className={`inline text-sm font-serif ${props.className || ''}`}>
      <span className='mr-1'>Powered by</span>
      <a
        href='https://github.com/chnbsdan'  // 替换为你的官网链接
        className='underline justify-start'>
        BSDAN智能家居制造商
      </a>
    </div>
  )
}
