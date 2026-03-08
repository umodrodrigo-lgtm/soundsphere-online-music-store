import React from 'react'
import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 48, text: 'text-3xl' },
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const { icon, text } = sizes[size]
  return (
    <Link to="/" className={`flex items-center gap-2 select-none ${className}`}>
      <svg width={icon} height={icon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#logoGrad)" />
        <circle cx="50" cy="50" r="20" fill="white" opacity="0.9" />
        <circle cx="50" cy="50" r="8" fill="url(#logoGrad)" />
        <path d="M50 15 A35 35 0 0 1 85 50" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      <span className={`font-display font-bold ${text} bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>
        SoundSphere
      </span>
    </Link>
  )
}
