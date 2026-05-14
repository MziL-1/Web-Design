import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16 px-6 py-12">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12">
        <div>
          <div className="font-display text-xl font-semibold text-gray-950 mb-3">BlogPlatform</div>
          <p className="text-sm text-gray-400 leading-relaxed">
            搭建你的个人博客，分享你的故事。探索来自世界各地的精彩内容。
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">分类</div>
          <ul className="space-y-2">
            <li><Link href="/?tab=discover" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">设计</Link></li>
            <li><Link href="/?tab=discover" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">技术</Link></li>
            <li><Link href="/?tab=discover" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">生活</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">链接</div>
          <ul className="space-y-2">
            <li><Link href="/?tab=discover" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">发现博客</Link></li>
            <li><Link href="/register" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">加入我们</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] mt-8 pt-6 border-t border-gray-200 flex justify-between text-xs text-gray-400">
        <span>© 2026 BlogPlatform. 保留所有权利.</span>
        <div>
          <Link href="#" className="text-gray-400 hover:text-gray-950 transition-colors mr-4">隐私政策</Link>
          <Link href="#" className="text-gray-400 hover:text-gray-950 transition-colors">服务条款</Link>
        </div>
      </div>
    </footer>
  );
}
