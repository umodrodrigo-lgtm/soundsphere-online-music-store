import React from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Users } from 'lucide-react'
import { ArtistProfile } from '@/types'
import { formatNumber, imgUrl } from '@/utils/format'

interface ArtistCardProps {
  artist: ArtistProfile & {
    song_count?: number
    follower_count?: number
    genre_name?: string
    genre_color?: string
  }
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      to={`/artists/${artist.id}`}
      className="card p-4 flex flex-col items-center text-center cursor-pointer group hover:scale-105 transition-transform duration-200"
    >
      <div className="relative mb-3">
        <img
          src={imgUrl(artist.profile_image, `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.stage_name)}&background=7c3aed&color=fff&size=200`)}
          alt={artist.stage_name}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-600/30 group-hover:ring-purple-500 transition-all"
        />
        {artist.is_verified && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
            <BadgeCheck className="w-4 h-4 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      <h3 className="font-semibold text-white text-sm mb-0.5 truncate w-full">{artist.stage_name}</h3>

      {artist.genre_name && (
        <span
          className="text-xs px-2 py-0.5 rounded-full mb-2 font-medium"
          style={{ backgroundColor: `${artist.genre_color}20`, color: artist.genre_color }}
        >
          {artist.genre_name}
        </span>
      )}

      <div className="flex items-center gap-1 text-slate-500 text-xs">
        <Users className="w-3 h-3" />
        <span>{formatNumber(artist.monthly_listeners || 0)} listeners</span>
      </div>
    </Link>
  )
}
