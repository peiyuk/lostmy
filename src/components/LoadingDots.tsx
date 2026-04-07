export default function LoadingDots({ color = 'bg-primary-500' }: { color?: string }) {
  return (
    <div className="flex gap-1 items-center justify-center py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${color} dot-flashing`}
          style={{ animationDelay: `${i * -0.16}s` }}
        />
      ))}
    </div>
  )
}
