import React from 'react'
import { Link } from 'react-router-dom'
import { Music2, Users, Globe, Award } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black font-display text-white mb-4">
          About <span className="gradient-text">SoundSphere</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto">
          We're building the future of music streaming — a platform where artists thrive and listeners discover.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop"
          alt="About"
          className="rounded-3xl object-cover w-full h-80"
        />
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-400 leading-relaxed mb-4">
            SoundSphere was born from a simple idea: music should be accessible to everyone, and artists should be fairly compensated for their work.
          </p>
          <p className="text-slate-400 leading-relaxed">
            We provide a platform where independent artists can upload, share, and earn from their music while listeners enjoy a premium experience.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { icon: Music2, label: '50M+ Songs',    color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: Users,  label: '100M+ Users',   color: 'text-pink-400',   bg: 'bg-pink-500/10' },
          { icon: Globe,  label: '180+ Countries', color: 'text-blue-400',  bg: 'bg-blue-500/10' },
          { icon: Award,  label: '2M+ Artists',   color: 'text-green-400',  bg: 'bg-green-500/10' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="card p-6 text-center">
            <div className={`inline-flex ${bg} p-4 rounded-2xl mb-3`}>
              <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{label.split(' ')[0]}</p>
            <p className="text-slate-500 text-sm">{label.split(' ').slice(1).join(' ')}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/subscription" className="btn-primary text-lg px-10 py-4">Start Streaming Free</Link>
      </div>
    </div>
  )
}
