import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Check, Zap, Crown, Users, Star } from 'lucide-react'
import { subsApi } from '@/services/api'
import { SubscriptionPlan } from '@/types'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency } from '@/utils/format'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:            <Zap className="w-8 h-8" />,
  premium:         <Crown className="w-8 h-8" />,
  'premium-yearly': <Star className="w-8 h-8" />,
  family:          <Users className="w-8 h-8" />,
}

const PLAN_COLORS: Record<string, string> = {
  free:            'from-slate-600 to-slate-700',
  premium:         'from-purple-600 to-pink-600',
  'premium-yearly': 'from-yellow-500 to-orange-500',
  family:          'from-blue-500 to-cyan-500',
}

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [subscribing, setSubscribing] = useState<number | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subsApi.plans().then(r => r.data.data as SubscriptionPlan[]),
  })

  const subscribeMutation = useMutation({
    mutationFn: (planId: number) => subsApi.subscribe(planId),
    onMutate:   (planId) => setSubscribing(planId),
    onSuccess:  () => {
      toast.success('Subscription activated! Welcome to Premium! 🎉')
      navigate('/dashboard')
    },
    onError: () => toast.error('Subscription failed. Please try again.'),
    onSettled: () => setSubscribing(null),
  })

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!user) { navigate('/login'); return }
    if (plan.price === 0) {
      toast.success('You are on the Free plan!')
      return
    }
    subscribeMutation.mutate(plan.id)
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
          <Crown className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">Choose Your Plan</span>
        </div>
        <h1 className="text-5xl font-black font-display text-white mb-4">
          Music Without <span className="gradient-text">Limits</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-xl mx-auto">
          Stream unlimited music, download offline, and experience crystal clear audio.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {(plans || []).map(plan => {
            const isPremiumPlan = plan.slug === 'premium'
            const gradient = PLAN_COLORS[plan.slug] || PLAN_COLORS.premium
            const Icon     = () => <>{PLAN_ICONS[plan.slug] || <Star className="w-8 h-8" />}</>
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string || '[]')

            return (
              <div
                key={plan.id}
                className={`relative card p-6 flex flex-col ${isPremiumPlan ? 'ring-2 ring-purple-500 scale-105' : ''}`}
              >
                {isPremiumPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className={`inline-flex bg-gradient-to-br ${gradient} p-4 rounded-2xl text-white mb-4 w-fit`}>
                  <Icon />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-white">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-500 text-sm ml-1">/{plan.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge text-xs ${plan.is_premium ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                    {plan.audio_quality} quality
                  </span>
                  {!plan.has_ads && <span className="badge bg-green-500/10 text-green-400 text-xs">No Ads</span>}
                  {plan.max_accounts > 1 && <span className="badge bg-blue-500/10 text-blue-400 text-xs">{plan.max_accounts} accounts</span>}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing === plan.id}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    isPremiumPlan
                      ? 'btn-primary'
                      : plan.price === 0
                      ? 'bg-white/10 hover:bg-white/15 text-white'
                      : `bg-gradient-to-r ${gradient} text-white hover:opacity-90`
                  }`}
                >
                  {subscribing === plan.id ? 'Processing...' : plan.price === 0 ? 'Get Started Free' : `Get ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* FAQ / Features */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-8">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { emoji: '🎵', title: 'Unlimited Streaming', desc: 'Listen to any song, any time with zero limitations.' },
            { emoji: '⬇️', title: 'Offline Downloads', desc: 'Download your favorites and listen without internet.' },
            { emoji: '🎧', title: 'Lossless Audio', desc: 'Crystal clear studio quality on compatible devices.' },
            { emoji: '📱', title: 'All Devices', desc: 'Available on web, mobile, desktop, and smart speakers.' },
            { emoji: '🚫', title: 'Ad-Free', desc: 'No interruptions, no ads. Just pure music.' },
            { emoji: '👨‍👩‍👧‍👦', title: 'Family Sharing', desc: 'Share with up to 6 family members under one plan.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="card p-6 text-center">
              <div className="text-4xl mb-3">{emoji}</div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
