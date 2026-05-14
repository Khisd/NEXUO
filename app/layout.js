export const metadata = {
  title: 'NEXUO | Decision Infrastructure',
  description: 'Premium TradingView Indicators Marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#050505] text-white font-sans antialiased">{children}</body>
    </html>
  )
}