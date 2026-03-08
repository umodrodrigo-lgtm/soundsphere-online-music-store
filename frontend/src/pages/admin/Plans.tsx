import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Plus, Edit, Check, X } from 'lucide-react'
import { adminApi } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatCurrency } from '@/utils/format'
import toast from 'react-hot-toast'
import { SubscriptionPlan } from '@/types'

export default function AdminPlans() {
  const queryClient = useQueryClient()
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<SubscriptionPlan>>({})

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.plans().then(r => r.data.data as SubscriptionPlan[]),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => adminApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      setEditId(null)
      toast.success('Plan updated')
    },
  })

  const toggleActive = (plan: SubscriptionPlan) => {
    updateMutation.mutate({ id: plan.id, data: { is_active: !plan.is_active } })
  }

  if (isLoading) return <LoadingSpinner size="lg" className="py-16" />

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-black font-display text-white">Subscription Plans</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(plans || []).map(plan => {
          const isEditing = editId === plan.id
          const features  = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string || '[]')
          return (
            <div key={plan.id} className={`card p-5 ${!plan.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold">{plan.name}</p>
                  <p className="text-2xl font-black text-purple-400">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                    {plan.price > 0 && <span className="text-slate-500 text-sm font-normal">/{plan.billing_cycle}</span>}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(isEditing ? null : plan.id); setEditData({ price: plan.price, name: plan.name }) }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 mb-3">
                  <input type="number" value={editData.price ?? plan.price}
                    onChange={e => setEditData(d => ({ ...d, price: parseFloat(e.target.value) }))}
                    className="input-field text-sm py-2" placeholder="Price" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: plan.id, data: editData })}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex-1 bg-white/10 text-slate-300 text-xs py-2 rounded-lg flex items-center justify-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5 mb-4">
                {features.slice(0, 4).map((f: string) => (
                  <div key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" /> {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {plan.is_premium && <span className="badge bg-purple-500/10 text-purple-400 text-[10px]">Premium</span>}
                  {!plan.has_ads  && <span className="badge bg-green-500/10 text-green-400 text-[10px]">No Ads</span>}
                </div>
                <button onClick={() => toggleActive(plan)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${plan.is_active ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
